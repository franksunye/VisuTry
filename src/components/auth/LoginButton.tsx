"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Twitter, LogOut, User, TestTube } from "lucide-react"
import { cn } from "@/utils/cn"
import { useTestSession } from "@/hooks/useTestSession"

interface LoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
}

export function LoginButton({ className, variant = "default" }: LoginButtonProps) {
  const { data: session, status } = useSession()
  const { testSession, loading: testLoading, clearTestSession } = useTestSession()

  // Check both NextAuth session and test session
  const isLoading = status === "loading" || testLoading
  const currentSession = session || testSession

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center px-4 py-2 rounded-lg",
        "bg-gray-100 text-gray-400",
        className
      )}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-2" />
        Loading...
      </div>
    )
  }

  if (currentSession) {
    const user = currentSession.user
    const isTestSession = testSession !== null

    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User Avatar"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              {user.name || user.username || "User"}
            </span>
            {isTestSession && (
              <span className="text-xs text-orange-600 flex items-center">
                <TestTube className="w-3 h-3 mr-1" />
                Test Mode
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => isTestSession ? clearTestSession() : signOut()}
          className={cn(
            "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            variant === "outline" && "border border-gray-300 text-gray-700 hover:bg-gray-50",
            variant === "ghost" && "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            variant === "default" && "bg-red-600 text-white hover:bg-red-700",
            className
          )}
        >
          <LogOut className="w-4 h-4 mr-1" />
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn("twitter")}
      className={cn(
        "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        variant === "outline" && "border border-blue-300 text-blue-700 hover:bg-blue-50",
        variant === "ghost" && "text-blue-600 hover:text-blue-700 hover:bg-blue-100",
        variant === "default" && "bg-blue-600 text-white hover:bg-blue-700",
        className
      )}
    >
      <Twitter className="w-4 h-4 mr-2" />
      Sign in with Twitter
    </button>
  )
}
