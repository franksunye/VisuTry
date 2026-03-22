'use client'

import { signOut, useSession } from 'next-auth/react'
import { User, LogOut, LayoutDashboard, ChevronDown, History, CreditCard } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTestSession } from '@/hooks/useTestSession'

export function UserMenu() {
  const { data: session } = useSession()
  const { testSession, clearTestSession } = useTestSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const user = session?.user || testSession?.user
  const isTestMode = !!testSession
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Close menu on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-700">
            {user?.name || 'User'}
          </div>
          {isTestMode && (
            <div className="text-xs text-orange-600">Test Mode</div>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          role="menu"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            {isTestMode && (
              <div className="text-xs text-orange-600 mt-1">🧪 Test Mode Active</div>
            )}
          </div>
          
          {/* Menu Items */}
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <LayoutDashboard className="w-4 h-4 mr-3 text-gray-500" />
            Dashboard
          </Link>

          <Link
            href="/dashboard/history"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <History className="w-4 h-4 mr-3 text-gray-500" />
            History
          </Link>

          <Link
            href="/payments"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <CreditCard className="w-4 h-4 mr-3 text-gray-500" />
            Payments
          </Link>
          
          {/* Divider */}
          <div className="border-t border-gray-100 my-1"></div>
          
          {/* Sign Out */}
          <button
            onClick={() => {
              setIsOpen(false)
              if (isTestMode) {
                clearTestSession()
              } else {
                signOut()
              }
            }}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

