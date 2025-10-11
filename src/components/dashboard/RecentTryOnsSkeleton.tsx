/**
 * 最近试戴记录骨架屏
 * 用于 Suspense fallback
 */
export function RecentTryOnsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          
          {/* "View All" link skeleton */}
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg overflow-hidden animate-pulse"
            >
              {/* Image skeleton */}
              <div className="aspect-square bg-gray-200"></div>
              
              {/* Info skeleton */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

