import { Clock, CheckCircle, XCircle, Loader2, ExternalLink, History } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

interface TryOnTask {
  id: string
  status: string
  userImageUrl: string
  resultImageUrl?: string | null
  createdAt: Date
}

interface RecentTryOnsProps {
  tryOns: TryOnTask[]
}

export function RecentTryOns({ tryOns }: RecentTryOnsProps) {
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
        return "Completed"
      case "processing":
        return "Processing"
      case "failed":
        return "Failed"
      default:
        return "Unknown"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-50"
      case "processing":
        return "text-blue-600 bg-blue-50"
      case "failed":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  if (tryOns.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Try-Ons</h2>
        </div>

        <div className="p-8 text-center">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No try-on records yet</h3>
          <p className="text-gray-500 mb-6">Start your first AI glasses try-on experience!</p>
          <Link
            href="/try-on"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Try-On
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Try-Ons</h2>
          <Link
            href="/dashboard/history"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            View All
            <ExternalLink className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tryOns.map((tryOn) => (
            <div key={tryOn.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Image Preview */}
              <div className="aspect-square bg-gray-100 relative">
                {tryOn.resultImageUrl ? (
                  <Image
                    src={tryOn.resultImageUrl}
                    alt="Try-on result"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                    quality={75}
                  />
                ) : (
                  <Image
                    src={tryOn.userImageUrl}
                    alt="User photo"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover opacity-50"
                    loading="lazy"
                    quality={75}
                  />
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tryOn.status)}`}>
                    {getStatusIcon(tryOn.status)}
                    <span className="ml-1">{getStatusText(tryOn.status)}</span>
                  </span>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(tryOn.createdAt), {
                      addSuffix: true
                    })}
                  </span>

                  {tryOn.status.toLowerCase() === "completed" && tryOn.resultImageUrl && (
                    <Link
                      href={`/share/${tryOn.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
