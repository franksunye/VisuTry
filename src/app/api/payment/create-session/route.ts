import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { createCheckoutSession, ProductType } from "@/lib/stripe"
import { isMockMode } from "@/lib/mocks"
import { mockCreateCheckoutSession } from "@/lib/mocks/stripe"
import { getRequestLanguageContext, logger } from "@/lib/logger"
import {
  sanitizeAcquisitionAttribution,
  serializeAttributionForStripe,
} from "@/lib/acquisition-attribution"
import { isValidLocale } from "@/i18n"
import { prisma } from "@/lib/prisma"
import { PRODUCT_METADATA, getProductQuota } from "@/config/pricing"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

function isSafeCheckoutReturnUrl(value: unknown, requestOrigin: string): value is string {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.origin === requestOrigin
  } catch {
    return false
  }
}

function getLanguageContextForLog(attribution: ReturnType<typeof sanitizeAcquisitionAttribution>) {
  if (!attribution) return {}

  return {
    ...(attribution.browser_language ? { browser_language: attribution.browser_language } : {}),
    ...(attribution.browser_languages ? { browser_languages: attribution.browser_languages } : {}),
    ...(attribution.landing_locale ? { landing_locale: attribution.landing_locale } : {}),
    ...(attribution.pricing_locale ? { pricing_locale: attribution.pricing_locale } : {}),
    ...(attribution.checkout_locale ? { checkout_locale: attribution.checkout_locale } : {}),
    ...(attribution.site_locale ? { site_locale: attribution.site_locale } : {}),
    ...(attribution.locale_changed ? { locale_changed: true } : {}),
  }
}

export async function POST(request: NextRequest) {
  const requestContext = getRequestLanguageContext(request)
  try {
    // 检查用户认证
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const body = await request.json()
    const { productType, priceId, successUrl, cancelUrl, unlockTaskId, attribution, locale } = body
    // 支持两种参数格式：productType 或 priceId
    let finalProductType: ProductType

    if (productType) {
      // 验证产品类型
      const validProductTypes: ProductType[] = ["PREMIUM_MONTHLY", "PREMIUM_YEARLY", "CREDITS_PACK", "CREDITS_PACK_PROMO_60", "PREMIUM_MONTHLY_PROMO", "PREMIUM_YEARLY_PROMO"]
      if (!validProductTypes.includes(productType)) {
        return NextResponse.json(
          { success: false, error: "无效的产品类型" },
          { status: 400 }
        )
      }
      finalProductType = productType
    } else if (priceId) {
      // 从priceId映射到productType
      const priceIdMap: Record<string, ProductType> = {
        'price_mock_premium': 'PREMIUM_MONTHLY',
        'price_mock_yearly': 'PREMIUM_YEARLY',
        'price_mock_credits': 'CREDITS_PACK'
      }

      finalProductType = priceIdMap[priceId]
      if (!finalProductType) {
        return NextResponse.json(
          { success: false, error: "无效的价格ID" },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: "需要提供productType或priceId" },
        { status: 400 }
      )
    }

    if (
      !isSafeCheckoutReturnUrl(successUrl, request.nextUrl.origin) ||
      !isSafeCheckoutReturnUrl(cancelUrl, request.nextUrl.origin)
    ) {
      return NextResponse.json(
        { success: false, error: "成功和取消URL必须使用当前站点域名" },
        { status: 400 }
      )
    }

    const checkoutLocale = typeof locale === 'string' && isValidLocale(locale) ? locale : 'en'
    const clientAttribution = sanitizeAcquisitionAttribution(attribution)
    // Geo fields are authoritative only when added from Stripe Checkout in
    // the signed webhook. Never persist client-supplied geo as billing geo.
    const { geo_country: _clientGeoCountry, geo_region: _clientGeoRegion, ...safeClientAttribution } = clientAttribution || {}
    const sanitizedAttribution = sanitizeAcquisitionAttribution({
      ...safeClientAttribution,
      site_locale: safeClientAttribution.site_locale || checkoutLocale,
      checkout_locale: checkoutLocale,
    })

    logger.info('payment', 'checkout_requested', {
      route: 'create_session',
      ...getLanguageContextForLog(sanitizedAttribution),
    }, requestContext)
    const normalizedUnlockTaskId = typeof unlockTaskId === 'string' && unlockTaskId.trim()
      ? unlockTaskId.trim()
      : undefined

    const canUnlockFaceAnalysisReport =
      finalProductType.startsWith('CREDITS_PACK') ||
      finalProductType.startsWith('PREMIUM_MONTHLY') ||
      finalProductType.startsWith('PREMIUM_YEARLY')

    if (normalizedUnlockTaskId && !canUnlockFaceAnalysisReport) {
      return NextResponse.json(
        { success: false, error: "该产品不支持解锁分析报告" },
        { status: 400 },
      )
    }

    if (normalizedUnlockTaskId) {
      const unlockTask = await prisma.faceAnalysisTask.findFirst({
        where: {
          id: normalizedUnlockTaskId,
          userId,
          status: 'COMPLETED',
        },
        select: { reportUnlocked: true },
      })

      if (!unlockTask) {
        return NextResponse.json(
          { success: false, error: "找不到可解锁的分析报告" },
          { status: 404 },
        )
      }

      if (unlockTask.reportUnlocked) {
        return NextResponse.json(
          { success: false, error: "该分析报告已经解锁" },
          { status: 409 },
        )
      }
    }

    // 创建Stripe Checkout会话
    let checkoutSession

    if (isMockMode) {
      console.log('🧪 Mock Payment: Creating mock checkout session')
      logger.info('payment', 'Creating mock checkout session', { productType: finalProductType }, requestContext)
      const serializedAttribution = serializeAttributionForStripe(sanitizedAttribution)
      checkoutSession = await mockCreateCheckoutSession({
        productType: finalProductType,
        userId: userId,
        successUrl: successUrl || 'http://localhost:3000/success',
        cancelUrl: cancelUrl || 'http://localhost:3000/cancel',
        ...(normalizedUnlockTaskId ? { unlockTaskId: normalizedUnlockTaskId } : {}),
        ...(serializedAttribution ? { attribution: serializedAttribution } : {}),
      })
    } else {
      checkoutSession = await createCheckoutSession({
        productType: finalProductType,
        userId: userId,
        successUrl,
        cancelUrl,
        unlockTaskId: normalizedUnlockTaskId,
        attribution: sanitizedAttribution,
        customerEmail: auth.session.user?.email,
        checkoutLocale,
      })
    }

    // Record the Session before the client leaves VisuTry. Signed Stripe
    // webhooks transition this row to COMPLETED or FAILED, so unpaid Checkout
    // attempts remain observable instead of disappearing into logs.
    await prisma.payment.create({
      data: {
        userId,
        stripeSessionId: checkoutSession.id,
        amount: PRODUCT_METADATA[finalProductType].price,
        currency: PRODUCT_METADATA[finalProductType].currency,
        status: 'PENDING',
        productType: finalProductType,
        description: normalizedUnlockTaskId
          ? `Personalized Glasses Advisor Report + ${getProductQuota(finalProductType)} non-expiring credits`
          : PRODUCT_METADATA[finalProductType].paymentDescription,
        unlockTaskId: normalizedUnlockTaskId,
        ...(sanitizedAttribution ? { attribution: sanitizedAttribution } : {}),
      },
    })

    logger.info('payment', 'checkout_created', {
      productType: finalProductType,
      checkoutContext: normalizedUnlockTaskId ? 'face_analysis_report' : 'pricing',
      status: 'PENDING',
      ...getLanguageContextForLog(sanitizedAttribution),
    }, requestContext)
    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      }
    })

  } catch (error) {
    console.error("创建支付会话失败:", error)
    logger.error('payment', 'checkout_failed', undefined, {
      route: 'create_session',
      stage: 'unexpected_failure',
    }, requestContext)
    return NextResponse.json(
      { success: false, error: "创建支付会话失败" },
      { status: 500 }
    )
  }
}
