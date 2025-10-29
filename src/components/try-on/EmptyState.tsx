"use client"

import { ImageIcon } from "lucide-react"

interface EmptyStateProps {
  message?: string
}

export function EmptyState({ message = "Your try-on result will appear here" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>

      <p className="text-lg text-gray-500 max-w-md">
        {message}
      </p>
    </div>
  )
}

