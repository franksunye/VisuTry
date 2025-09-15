import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { generateTryOnImage } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      )
    }

    // 检查用户是否有剩余次数
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

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
    const userImageFilename = `try-on/${session.user.id}/${Date.now()}-user.jpg`
    const userImageBlob = await put(userImageFilename, userImageFile, {
      access: "public",
    })

    let glassesImageUrl: string

    if (glassesImageFile) {
      // 上传眼镜图片
      const glassesImageFilename = `try-on/${session.user.id}/${Date.now()}-glasses.jpg`
      const glassesImageBlob = await put(glassesImageFilename, glassesImageFile, {
        access: "public",
      })
      glassesImageUrl = glassesImageBlob.url
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

    // 创建试戴任务记录
    const tryOnTask = await prisma.tryOnTask.create({
      data: {
        userId: session.user.id,
        userImageUrl: userImageBlob.url,
        glassesImageUrl,
        status: "PROCESSING"
      }
    })

    // 异步处理AI试戴
    processTryOnAsync(tryOnTask.id, userImageBlob.url, glassesImageUrl)
      .catch(error => {
        console.error("异步处理试戴失败:", error)
      })

    // 更新用户使用次数（仅对免费用户）
    if (!isPremiumActive) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          freeTrialsUsed: user.freeTrialsUsed + 1
        }
      })
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
    // 调用Gemini API进行图像处理
    const result = await generateTryOnImage({
      userImageUrl,
      glassesImageUrl
    })

    if (result.success && result.imageUrl) {
      // 更新任务状态为完成
      await prisma.tryOnTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          resultImageUrl: result.imageUrl
        }
      })
    } else {
      // 更新任务状态为失败
      await prisma.tryOnTask.update({
        where: { id: taskId },
        data: {
          status: "FAILED",
          errorMessage: result.error || "AI处理失败"
        }
      })
    }
  } catch (error) {
    console.error("处理试戴任务失败:", error)
    
    // 更新任务状态为失败
    await prisma.tryOnTask.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "未知错误"
      }
    })
  }
}
