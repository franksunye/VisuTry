// Mock Database Service for Testing
import { mockUsers, mockTryOnResults, isMockMode } from './index'

// Mock database operations
export class MockDatabase {
  private static users = [...mockUsers]
  private static tryOnTasks = [...mockTryOnResults]
  private static taskIdCounter = 1

  // User operations
  static async findUser(criteria: { id?: string; email?: string; username?: string }) {
    if (!isMockMode) return null
    
    const user = this.users.find(u => 
      (criteria.id && u.id === criteria.id) ||
      (criteria.email && u.email === criteria.email) ||
      (criteria.username && u.username === criteria.username)
    )
    
    return user || null
  }

  static async updateUser(id: string, data: Partial<typeof mockUsers[0]>) {
    if (!isMockMode) return null
    
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) return null
    
    this.users[userIndex] = { ...this.users[userIndex], ...data }
    return this.users[userIndex]
  }

  // Try-on task operations
  static async createTryOnTask(data: {
    userId: string
    frameId: string
    originalImageUrl: string
    status?: string
  }) {
    if (!isMockMode) return null
    
    const task = {
      id: `mock-task-${this.taskIdCounter++}`,
      userId: data.userId,
      frameId: data.frameId,
      originalImageUrl: data.originalImageUrl,
      resultImageUrl: null,
      status: data.status || 'processing',
      createdAt: new Date(),
      isPublic: false,
      ...data
    }
    
    this.tryOnTasks.push(task)
    return task
  }

  static async findTryOnTask(id: string) {
    if (!isMockMode) return null
    
    return this.tryOnTasks.find(t => t.id === id) || null
  }

  static async updateTryOnTask(id: string, data: any) {
    if (!isMockMode) return null
    
    const taskIndex = this.tryOnTasks.findIndex(t => t.id === id)
    if (taskIndex === -1) return null
    
    this.tryOnTasks[taskIndex] = { ...this.tryOnTasks[taskIndex], ...data }
    return this.tryOnTasks[taskIndex]
  }

  static async findUserTryOnTasks(userId: string) {
    if (!isMockMode) return []
    
    return this.tryOnTasks.filter(t => t.userId === userId)
  }

  static async findPublicTryOnTasks() {
    if (!isMockMode) return []
    
    return this.tryOnTasks.filter(t => t.isPublic)
  }

  // Payment operations
  static async updateUserSubscription(userId: string, isPremium: boolean, expiresAt?: Date) {
    if (!isMockMode) return null
    
    return this.updateUser(userId, {
      isPremium,
      premiumExpiresAt: expiresAt || null
    })
  }

  // Reset data for testing
  static resetData() {
    if (!isMockMode) return
    
    this.users = [...mockUsers]
    this.tryOnTasks = [...mockTryOnResults]
    this.taskIdCounter = 1
  }
}

// Mock Prisma client for testing
export const mockPrisma = {
  user: {
    findFirst: async (params: any) => {
      if (!isMockMode) throw new Error('Mock database only available in test mode')
      
      const where = params?.where || {}
      return MockDatabase.findUser({
        id: where.id,
        email: where.email,
        username: where.username
      })
    },
    
    findUnique: async (params: any) => {
      if (!isMockMode) throw new Error('Mock database only available in test mode')
      
      const where = params?.where || {}
      return MockDatabase.findUser({
        id: where.id,
        email: where.email,
        username: where.username
      })
    },
    
    update: async (params: any) => {
      if (!isMockMode) throw new Error('Mock database only available in test mode')
      
      const where = params?.where || {}
      const data = params?.data || {}
      
      if (where.id) {
        return MockDatabase.updateUser(where.id, data)
      }
      return null
    }
  },
  
  tryOnTask: {
    create: async (params: any) => {
      if (!isMockMode) throw new Error('Mock database only available in test mode')
      
      const data = params?.data || {}
      return MockDatabase.createTryOnTask(data)
    },
    
    findUnique: async (params: any) => {
      if (!isMockMode) throw new Error('Mock database only available in test mode')
      
      const where = params?.where || {}
      return MockDatabase.findTryOnTask(where.id)
    },
    
    update: async (params: any) => {
      if (!isMockMode) throw new Error('Mock database only available in test mode')
      
      const where = params?.where || {}
      const data = params?.data || {}
      
      if (where.id) {
        return MockDatabase.updateTryOnTask(where.id, data)
      }
      return null
    },
    
    findMany: async (params: any) => {
      if (!isMockMode) throw new Error('Mock database only available in test mode')
      
      const where = params?.where || {}
      
      if (where.userId) {
        return MockDatabase.findUserTryOnTasks(where.userId)
      }
      
      if (where.isPublic) {
        return MockDatabase.findPublicTryOnTasks()
      }
      
      return MockDatabase.tryOnTasks
    }
  }
}

export default MockDatabase
