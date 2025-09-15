"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Twitter, LogOut, User } from "lucide-react"
import { cn } from "@/utils/cn"

interface LoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
}

export function LoginButton({ className, variant = "default" }: LoginButtonProps) {
  const { data: session, status } = useSession()

  if (status === "loading") {
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

  if (session) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User Avatar"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">
            {session.user.name || session.user.username || "User"}
          </span>
        </div>
        
        <button
          onClick={() => signOut()}
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
