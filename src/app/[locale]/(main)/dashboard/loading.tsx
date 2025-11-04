/**
 * Dashboard Loading Skeleton
 * 
 * This loading state is automatically shown by Next.js while the dashboard page
 * is being rendered on the server. It provides immediate visual feedback to users,
 * significantly improving perceived performance.
 */

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded w-40 animate-pulse"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Cards Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="ml-4 flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-2 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Try-Ons Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Image Skeleton */}
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    
                    {/* Info Skeleton */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Subscription Card Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="ml-4 flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
            
            <div className="mt-4 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-5 bg-gray-200 rounded w-28 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Tips Skeleton */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <div className="h-5 bg-blue-200 rounded w-16 mb-3 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-3 bg-blue-200 rounded w-full animate-pulse"></div>
              <div className="h-3 bg-blue-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-3 bg-blue-200 rounded w-4/5 animate-pulse"></div>
              <div className="h-3 bg-blue-200 rounded w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

