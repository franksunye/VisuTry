"use client"

import { useState } from "react"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  Share2, 
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/utils/cn"

interface TryOnTask {
  id: string
  status: string
  userImageUrl: string
  glassesImageUrl?: string | null
  resultImageUrl?: string | null
  errorMessage?: string | null
  createdAt: Date
  updatedAt: Date
  metadata?: any
}

interface TryOnHistoryListProps {
  tasks: TryOnTask[]
  currentPage: number
  totalPages: number
  currentStatus: string
}

export function TryOnHistoryList({ 
  tasks, 
  currentPage, 
  totalPages, 
  currentStatus 
}: TryOnHistoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "已完成"
      case "processing":
        return "处理中"
      case "failed":
        return "失败"
      default:
        return "未知"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200"
      case "processing":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "failed":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("确定要删除这个试戴记录吗？此操作无法撤销。")) {
      return
    }

    setDeletingId(taskId)
    
    try {
      const response = await fetch(`/api/try-on/${taskId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        // 刷新页面
        window.location.reload()
      } else {
        throw new Error("删除失败")
      }
    } catch (error) {
      console.error("删除失败:", error)
      alert("删除失败，请重试")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (imageUrl: string, taskId: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = url
      link.download = `visutry-result-${taskId}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("下载失败:", error)
      alert("下载失败，请重试")
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {currentStatus === "all" ? "还没有试戴记录" : `没有${getStatusText(currentStatus)}的记录`}
        </h3>
        <p className="text-gray-500 mb-6">
          开始您的AI眼镜试戴之旅吧！
        </p>
        <Link
          href="/try-on"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          开始试戴
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 任务网格 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {/* 图片预览 */}
            <div className="aspect-square bg-gray-100 relative">
              <img
                src={task.resultImageUrl || task.userImageUrl}
                alt={task.status === "COMPLETED" ? "试戴结果" : "用户照片"}
                className={cn(
                  "w-full h-full object-cover",
                  task.status !== "COMPLETED" && "opacity-50"
                )}
              />
              
              {/* 状态标签 */}
              <div className="absolute top-3 left-3">
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                  getStatusColor(task.status)
                )}>
                  {getStatusIcon(task.status)}
                  <span className="ml-1">{getStatusText(task.status)}</span>
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="absolute top-3 right-3 flex space-x-1">
                {task.status === "COMPLETED" && task.resultImageUrl && (
                  <>
                    <button
                      onClick={() => handleDownload(task.resultImageUrl!, task.id)}
                      className="w-8 h-8 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-colors"
                      title="下载图片"
                    >
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                    
                    <Link
                      href={`/share/${task.id}`}
                      className="w-8 h-8 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-colors"
                      title="查看分享页面"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-700" />
                    </Link>
                  </>
                )}
                
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={deletingId === task.id}
                  className="w-8 h-8 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  title="删除记录"
                >
                  {deletingId === task.id ? (
                    <Loader2 className="w-4 h-4 text-gray-700 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-600" />
                  )}
                </button>
              </div>
            </div>
            
            {/* 信息区域 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(task.createdAt), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                </span>
              </div>
              
              {task.status === "FAILED" && task.errorMessage && (
                <p className="text-xs text-red-600 mt-2 line-clamp-2">
                  {task.errorMessage}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Link
            href={`/dashboard/history?status=${currentStatus}&page=${Math.max(1, currentPage - 1)}`}
            className={cn(
              "flex items-center px-3 py-2 rounded-lg transition-colors",
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一页
          </Link>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/dashboard/history?status=${currentStatus}&page=${page}`}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-lg transition-colors",
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {page}
              </Link>
            ))}
          </div>
          
          <Link
            href={`/dashboard/history?status=${currentStatus}&page=${Math.min(totalPages, currentPage + 1)}`}
            className={cn(
              "flex items-center px-3 py-2 rounded-lg transition-colors",
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            下一页
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  )
}
