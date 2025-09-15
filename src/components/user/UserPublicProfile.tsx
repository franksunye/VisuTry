import { Calendar, Star, Glasses, Award } from "lucide-react"

interface User {
  id: string
  name?: string | null
  username?: string | null
  image?: string | null
  createdAt: Date
  isPremium?: boolean
  _count: {
    tryOnTasks: number
  }
}

interface UserPublicProfileProps {
  user: User
  publicTryOnsCount: number
}

export function UserPublicProfile({ user, publicTryOnsCount }: UserPublicProfileProps) {
  const displayName = user.name || user.username || "User"
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long"
  })

  // Calculate user level based on number of works
  const getUserLevel = (count: number) => {
    if (count >= 50) return { level: "Master", color: "text-purple-600", icon: Award }
    if (count >= 20) return { level: "Expert", color: "text-blue-600", icon: Star }
    if (count >= 10) return { level: "Pro", color: "text-green-600", icon: Glasses }
    if (count >= 5) return { level: "Advanced", color: "text-yellow-600", icon: Star }
    if (count >= 1) return { level: "Beginner", color: "text-gray-600", icon: Glasses }
    return { level: "Visitor", color: "text-gray-400", icon: Glasses }
  }

  const userLevel = getUserLevel(publicTryOnsCount)
  const LevelIcon = userLevel.icon

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* Background Banner */}
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4">
            <Glasses className="w-8 h-8 text-white" />
          </div>
          <div className="absolute top-8 right-8">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div className="absolute bottom-4 left-1/3">
            <div className="w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
            {user.image ? (
              <img
                src={user.image}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User Information */}
        <div className="pt-20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                {displayName}
                {user.isPremium && (
                  <div className="ml-2 flex items-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm text-yellow-600 ml-1">Premium Member</span>
                  </div>
                )}
              </h2>
              
              <div className="flex items-center text-gray-600 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Joined {joinDate}</span>
              </div>
              
              <div className="flex items-center">
                <LevelIcon className={`w-4 h-4 mr-2 ${userLevel.color}`} />
                <span className={`text-sm font-medium ${userLevel.color}`}>
                  {userLevel.level} User
                </span>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {publicTryOnsCount}
              </div>
              <div className="text-sm text-gray-600">Public Works</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {user.isPremium ? "Premium" : "Free"}
              </div>
              <div className="text-sm text-gray-600">Membership</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${userLevel.color}`}>
                {userLevel.level}
              </div>
              <div className="text-sm text-gray-600">User Level</div>
            </div>
          </div>

          {/* Achievement Badges */}
          {publicTryOnsCount > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Achievement Badges</h4>
              <div className="flex flex-wrap gap-2">
                {publicTryOnsCount >= 1 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Glasses className="w-3 h-3 mr-1" />
                    First Share
                  </span>
                )}
                {publicTryOnsCount >= 5 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Star className="w-3 h-3 mr-1" />
                    Active User
                  </span>
                )}
                {publicTryOnsCount >= 10 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Award className="w-3 h-3 mr-1" />
                    Creator Pro
                  </span>
                )}
                {user.isPremium && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    Premium Member
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
