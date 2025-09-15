import { User, TryOnTask, Payment, GlassesFrame } from '@prisma/client'

// User related types
export interface UserProfile extends User {
  remainingTrials: number
  isPremiumActive: boolean
}

// Try-on task types
export interface TryOnRequest {
  userImageFile: File
  glassesImageFile?: File
  glassesFrameId?: string
  prompt?: string
}

export interface TryOnResponse {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultImageUrl?: string
  errorMessage?: string
}

export interface TryOnTaskWithDetails extends TryOnTask {
  user: User
}

// Payment types
export interface PaymentRequest {
  productType: 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | 'CREDITS_PACK'
  successUrl: string
  cancelUrl: string
}

export interface PaymentResponse {
  sessionId: string
  url: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Upload types
export interface UploadResponse {
  url: string
  filename: string
  size: number
}

// Glasses frame types
export interface GlassesFrameWithCategory extends GlassesFrame {
  category: string
}

// Share types
export interface ShareData {
  taskId: string
  imageUrl: string
  title: string
  description: string
}

// Analytics types
export interface UserStats {
  totalTryOns: number
  successfulTryOns: number
  freeTrialsUsed: number
  isPremium: boolean
  premiumExpiresAt?: Date
}

export interface AdminStats {
  totalUsers: number
  totalTryOns: number
  premiumUsers: number
  revenue: number
  successRate: number
}
