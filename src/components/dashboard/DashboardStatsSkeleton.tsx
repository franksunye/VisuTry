/**
 * Dashboard 统计卡片骨架屏
 * 用于 Suspense fallback
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-6 bg-white border shadow-sm rounded-xl animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              
              {/* Value skeleton */}
              <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
              
              {/* Description skeleton */}
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            
            {/* Icon skeleton */}
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

