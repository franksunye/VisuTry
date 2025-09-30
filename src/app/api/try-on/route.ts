import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { generateTryOnImage } from "@/lib/gemini"
import { isMockMode } from "@/lib/mocks"
import { MockDatabase } from "@/lib/mocks/database"
import { mockBlobUpload } from "@/lib/mocks/blob"
import { mockGenerateTryOnImage } from "@/lib/mocks/gemini"
import { getTestSessionFromRequest } from "@/lib/test-session"

export async function POST(request: NextRequest) {
  try {
    // 检查用户认证 (NextAuth 或测试会话)
    const session = await getServerSession(authOptions)
    const testSession = !session ? getTestSessionFromRequest(request) : null

    if (!session && !testSession) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      )
    }

    // 使用会话数据
    const userId = session?.user?.id || testSession?.id || 'unknown'
    const userEmail = session?.user?.email || testSession?.email || 'test@example.com'

    // 检查用户是否有剩余次数
    let user
    if (testSession) {
      // 使用测试会话数据
      console.log('🧪 Test Session: Using test session data')
      user = testSession
    } else if (isMockMode) {
      console.log('🧪 Mock Try-On: Using mock database')
      user = await MockDatabase.findUser({ id: userId })
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId }
      })
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      )
    }

    // 检查使用次数限制
    const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
    const isPremiumActive = user.isPremium && 
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())

    if (!isPremiumActive && user.freeTrialsUsed >= freeTrialLimit) {
      return NextResponse.json(
        { success: false, error: "免费试用次数已用完，请升级到高级会员" },
        { status: 403 }
      )
    }

    // 获取上传的文件
    const formData = await request.formData()
    const userImageFile = formData.get("userImage") as File
    const glassesImageFile = formData.get("glassesImage") as File
    const frameId = formData.get("frameId") as string

    if (!userImageFile) {
      return NextResponse.json(
        { success: false, error: "用户照片是必需的" },
        { status: 400 }
      )
    }

    if (!glassesImageFile && !frameId) {
      return NextResponse.json(
        { success: false, error: "请选择眼镜款式或上传眼镜图片" },
        { status: 400 }
      )
    }

    // 上传用户图片
    const userImageFilename = `try-on/${userId}/${Date.now()}-user.jpg`
    let userImageBlob

    if (isMockMode) {
      userImageBlob = await mockBlobUpload(userImageFilename, userImageFile)
    } else {
      userImageBlob = await put(userImageFilename, userImageFile, {
        access: "public",
      })
    }

    let glassesImageUrl: string

    if (glassesImageFile) {
      // 上传眼镜图片
      const glassesImageFilename = `try-on/${userId}/${Date.now()}-glasses.jpg`
      let glassesImageBlob

      if (isMockMode) {
        glassesImageBlob = await mockBlobUpload(glassesImageFilename, glassesImageFile)
      } else {
        glassesImageBlob = await put(glassesImageFilename, glassesImageFile, {
          access: "public",
        })
      }
      glassesImageUrl = glassesImageBlob.url
    } else {
      if (isMockMode) {
        // 在Mock模式下使用Mock框架数据
        const { mockGlassesFrames } = await import('@/lib/mocks')
        const frame = mockGlassesFrames.find(f => f.id === frameId)

        if (!frame) {
          return NextResponse.json(
            { success: false, error: "选择的眼镜框架不存在" },
            { status: 404 }
          )
        }

        glassesImageUrl = frame.imageUrl
      } else {
        // 从数据库获取框架图片
        const frame = await prisma.glassesFrame.findUnique({
          where: { id: frameId }
        })

        if (!frame) {
          return NextResponse.json(
            { success: false, error: "选择的眼镜框架不存在" },
            { status: 404 }
          )
        }

        glassesImageUrl = frame.imageUrl
      }
    }

    // 创建试戴任务记录
    let tryOnTask
    if (isMockMode) {
      tryOnTask = await MockDatabase.createTryOnTask({
        userId: userId,
        frameId: frameId,
        originalImageUrl: userImageBlob.url,
        status: "processing"
      })
    } else {
      tryOnTask = await prisma.tryOnTask.create({
        data: {
          userId: userId,
          userImageUrl: userImageBlob.url,
          glassesImageUrl,
          status: "PROCESSING"
        }
      })
    }

    if (!tryOnTask) {
      return NextResponse.json(
        { success: false, error: "创建试戴任务失败" },
        { status: 500 }
      )
    }

    // 异步处理AI试戴
    processTryOnAsync(tryOnTask.id, userImageBlob.url, glassesImageUrl)
      .catch(error => {
        console.error("异步处理试戴失败:", error)
      })

    // 更新用户使用次数（仅对免费用户）
    if (!isPremiumActive) {
      if (isMockMode) {
        await MockDatabase.updateUser(userId, {
          freeTrialsUsed: user.freeTrialsUsed + 1
        })
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: {
            freeTrialsUsed: user.freeTrialsUsed + 1
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId: tryOnTask.id,
        status: "processing",
        message: "AI正在处理您的试戴请求，请稍候..."
      }
    })

  } catch (error) {
    console.error("试戴API错误:", error)
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// 异步处理试戴任务
async function processTryOnAsync(taskId: string, userImageUrl: string, glassesImageUrl: string) {
  try {
    let result

    if (isMockMode) {
      // 在Mock模式下使用Mock AI服务
      result = await mockGenerateTryOnImage({
        userImageUrl,
        glassesImageUrl
      })
    } else {
      // 调用Gemini API进行图像处理
      result = await generateTryOnImage({
        userImageUrl,
        glassesImageUrl
      })
    }

    if (result.success && result.imageUrl) {
      // 更新任务状态为完成
      if (isMockMode) {
        await MockDatabase.updateTryOnTask(taskId, {
          status: "completed",
          resultImageUrl: result.imageUrl
        })
      } else {
        await prisma.tryOnTask.update({
          where: { id: taskId },
          data: {
            status: "COMPLETED",
            resultImageUrl: result.imageUrl
          }
        })
      }
    } else {
      // 更新任务状态为失败
      if (isMockMode) {
        await MockDatabase.updateTryOnTask(taskId, {
          status: "failed",
          errorMessage: result.error || "AI处理失败"
        })
      } else {
        await prisma.tryOnTask.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMessage: result.error || "AI处理失败"
          }
        })
      }
    }
  } catch (error) {
    console.error("处理试戴任务失败:", error)

    // 更新任务状态为失败
    if (isMockMode) {
      await MockDatabase.updateTryOnTask(taskId, {
        status: "failed",
        errorMessage: "处理过程中发生错误"
      })
    } else {
      await prisma.tryOnTask.update({
        where: { id: taskId },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "未知错误"
        }
      })
    }
  }
}
