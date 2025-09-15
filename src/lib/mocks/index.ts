// Mock Services for Testing
// This file provides mock implementations of external services

export const isMockMode = process.env.ENABLE_MOCKS === 'true' || process.env.NODE_ENV === 'test'

// Mock data for testing
export const mockUsers = [
  {
    id: 'mock-user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://via.placeholder.com/150',
    username: 'testuser',
    freeTrialsUsed: 1,
    isPremium: false,
    premiumExpiresAt: null,
  },
  {
    id: 'mock-user-2',
    email: 'premium@example.com',
    name: 'Premium User',
    image: 'https://via.placeholder.com/150',
    username: 'premiumuser',
    freeTrialsUsed: 0,
    isPremium: true,
    premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  }
]

export const mockGlassesFrames = [
  {
    id: 'frame-1',
    name: 'Classic Black Frame',
    description: 'Timeless black rectangular glasses',
    category: 'Rectangle',
    brand: 'MockBrand',
    imageUrl: 'https://via.placeholder.com/300x200/000000/FFFFFF?text=Black+Frame',
    price: 99.99,
  },
  {
    id: 'frame-2',
    name: 'Round Vintage',
    description: 'Stylish round vintage glasses',
    category: 'Round',
    brand: 'MockBrand',
    imageUrl: 'https://via.placeholder.com/300x200/8B4513/FFFFFF?text=Round+Frame',
    price: 129.99,
  },
  {
    id: 'frame-3',
    name: 'Cat Eye Chic',
    description: 'Elegant cat eye glasses',
    category: 'Cat Eye',
    brand: 'MockBrand',
    imageUrl: 'https://via.placeholder.com/300x200/FF69B4/FFFFFF?text=Cat+Eye',
    price: 149.99,
  }
]

export const mockTryOnResults = [
  {
    id: 'tryon-1',
    userId: 'mock-user-1',
    frameId: 'frame-1',
    originalImageUrl: 'https://via.placeholder.com/400x400/87CEEB/000000?text=Original+Photo',
    resultImageUrl: 'https://via.placeholder.com/400x400/87CEEB/000000?text=With+Glasses',
    status: 'completed',
    createdAt: new Date(),
    isPublic: true,
  }
]
