import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"
import { isMockMode } from "@/lib/mocks"
import { mockBlobUpload } from "@/lib/mocks/blob"
import { logger } from "@/lib/logger"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      )
    }

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "未找到文件" },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "不支持的文件类型" },
        { status: 400 }
      )
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "文件大小超过限制" },
        { status: 400 }
      )
    }

    // 生成文件名
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${session.user.id}/${timestamp}.${extension}`

    try {
      let blob

      if (isMockMode) {
        // 在测试模式下使用Mock上传
        console.log('🧪 Mock Upload: Using mock blob upload service')
        logger.debug('api', 'Mock Upload: Using mock blob upload service')
        blob = await mockBlobUpload(filename, file)
      } else {
        // 上传到Vercel Blob
        blob = await put(filename, file, {
          access: "public",
        })
      }

      logger.info('api', 'File uploaded successfully', { filename, size: file.size, type: file.type, url: blob.url })
      return NextResponse.json({
        success: true,
        data: {
          url: blob.url,
          filename: filename,
          size: file.size,
          type: file.type
        }
      })
    } catch (uploadError) {
      const err = uploadError instanceof Error ? uploadError : new Error(String(uploadError))
      console.error("文件上传失败:", uploadError)
      logger.error('api', '文件上传失败', err, { filename })
      return NextResponse.json(
        { success: false, error: "文件上传失败" },
        { status: 500 }
      )
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("上传API错误:", error)
    logger.error('api', '上传API错误', err)
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// 获取上传限制信息
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      maxFiles: 1
    }
  })
}
