"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface GlassesFrame {
  id: string
  name: string
  description: string
  category: string
  brand: string
  imageUrl: string
  price: number
  isActive: boolean
}

export default function TestFramesPage() {
  const [frames, setFrames] = useState<GlassesFrame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<GlassesFrame | null>(null)

  useEffect(() => {
    fetchFrames()
  }, [])

  const fetchFrames = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/frames')
      const data = await response.json()
      
      if (data.success) {
        setFrames(data.data)
        console.log('Frames loaded:', data.data)
      } else {
        setError('Failed to load frames')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching frames:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">🕶️ Glasses Frames Test</h1>
        <div className="text-center">Loading frames...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">🕶️ Glasses Frames Test</h1>
        <div className="bg-red-100 p-4 rounded-lg text-red-700">
          Error: {error}
          <button 
            onClick={fetchFrames}
            className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">🕶️ Glasses Frames Test</h1>
      
      <div className="mb-6 bg-blue-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">✅ Test Results</h2>
        <p className="text-blue-700">
          Successfully loaded <strong>{frames.length}</strong> glasses frames from the API
        </p>
      </div>

      {selectedFrame && (
        <div className="mb-6 bg-green-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Selected Frame</h2>
          <div className="text-green-700">
            <p><strong>Name:</strong> {selectedFrame.name}</p>
            <p><strong>Brand:</strong> {selectedFrame.brand}</p>
            <p><strong>Category:</strong> {selectedFrame.category}</p>
            <p><strong>Price:</strong> ${selectedFrame.price}</p>
            <p><strong>Description:</strong> {selectedFrame.description}</p>
          </div>
          <button
            onClick={() => setSelectedFrame(null)}
            className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {frames.map((frame) => (
          <div 
            key={frame.id} 
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedFrame?.id === frame.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedFrame(frame)}
          >
            <div className="aspect-square relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={frame.imageUrl}
                alt={frame.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback for broken images
                  const target = e.target as HTMLImageElement
                  target.src = 'https://via.placeholder.com/300x300/E5E7EB/6B7280?text=Glasses'
                }}
              />
            </div>
            
            <h3 className="font-semibold text-lg mb-2">{frame.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{frame.description}</p>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{frame.brand}</span>
              <span className="font-bold text-blue-600">${frame.price}</span>
            </div>
            
            <div className="mt-2">
              <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                {frame.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🧪 Test Instructions</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Click on any frame to select it and see details</li>
          <li>• All frames are loaded from the mock API</li>
          <li>• Images are placeholder images for testing</li>
          <li>• This tests the frames browsing functionality</li>
          <li>• Next step: Test login and try-on features</li>
        </ul>
      </div>
    </div>
  )
}
