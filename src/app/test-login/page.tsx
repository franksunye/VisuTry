"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"

export default function TestLoginPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("free@example.com")
  const [userType, setUserType] = useState("free")

  const handleMockLogin = async () => {
    try {
      // Use our custom mock login API
      const response = await fetch('/api/test/mock-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userType,
        }),
      })

      const result = await response.json()
      console.log("Mock login result:", result)

      if (result.success) {
        // Refresh the page to update the session
        window.location.reload()
      } else {
        console.error("Mock login failed:", result.error)
      }
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const handleTwitterLogin = async () => {
    try {
      const result = await signIn("twitter", {
        redirect: false,
      })
      console.log("Twitter login result:", result)
    } catch (error) {
      console.error("Twitter login error:", error)
    }
  }

  if (status === "loading") {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">🧪 Test Login Page</h1>
      
      {session ? (
        <div className="bg-green-100 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Logged In</h2>
          <div className="text-sm text-green-700">
            <p><strong>Name:</strong> {session.user?.name}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>ID:</strong> {session.user?.id}</p>
            <p><strong>Free Trials Used:</strong> {session.user?.freeTrialsUsed || 0}</p>
            <p><strong>Premium:</strong> {session.user?.isPremium ? "Yes" : "No"}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Mock Login (Test Mode)</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="test@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type:
                </label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="free">Free User</option>
                  <option value="premium">Premium User</option>
                </select>
              </div>
              
              <button
                onClick={handleMockLogin}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                🧪 Mock Login
              </button>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Twitter Login (Real)</h2>
            <button
              onClick={handleTwitterLogin}
              className="w-full bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 flex items-center justify-center"
            >
              🐦 Sign in with Twitter
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Use Mock Login for testing without external services</li>
          <li>Free users get 3 trial uses</li>
          <li>Premium users get unlimited uses</li>
          <li>After login, you can test the try-on features</li>
        </ul>
      </div>
    </div>
  )
}
