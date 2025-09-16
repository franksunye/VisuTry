// Mock Vercel Blob Service for Testing
import { isMockMode } from "./index"

export interface MockBlobResult {
  url: string
  downloadUrl: string
  pathname: string
  size: number
  uploadedAt: Date
}

// Mock blob storage
const mockBlobs: Map<string, MockBlobResult> = new Map()

export class MockBlob {
  static async put(
    pathname: string, 
    body: string | Buffer | ReadableStream | File,
    options?: { access?: 'public' | 'private' }
  ): Promise<MockBlobResult> {
    if (!isMockMode) {
      throw new Error("Mock Blob called in non-mock mode")
    }

    console.log('📁 Mock Blob: Uploading file...')
    console.log('📂 Pathname:', pathname)
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Generate mock file size
    let size = 0
    if (typeof body === 'string') {
      size = Buffer.byteLength(body, 'utf8')
    } else if (body instanceof Buffer) {
      size = body.length
    } else if (body instanceof File) {
      size = body.size
    } else {
      size = Math.floor(Math.random() * 1000000) + 100000 // Random size between 100KB-1MB
    }

    const mockResult: MockBlobResult = {
      url: `https://mock-blob-storage.vercel.app/${pathname}`,
      downloadUrl: `https://mock-blob-storage.vercel.app/${pathname}?download=1`,
      pathname,
      size,
      uploadedAt: new Date(),
    }

    mockBlobs.set(pathname, mockResult)
    
    console.log('✅ Mock Blob: File uploaded successfully')
    console.log('🔗 URL:', mockResult.url)
    console.log('📊 Size:', `${(size / 1024).toFixed(2)} KB`)
    
    return mockResult
  }

  static async del(url: string | string[]): Promise<void> {
    if (!isMockMode) {
      throw new Error("Mock Blob called in non-mock mode")
    }

    const urls = Array.isArray(url) ? url : [url]
    
    console.log('🗑️ Mock Blob: Deleting files...')
    
    for (const fileUrl of urls) {
      // Extract pathname from URL
      const pathname = fileUrl.replace('https://mock-blob-storage.vercel.app/', '')
      mockBlobs.delete(pathname)
      console.log('❌ Deleted:', pathname)
    }
    
    console.log('✅ Mock Blob: Files deleted successfully')
  }

  static async list(options?: { prefix?: string; limit?: number }): Promise<{ blobs: MockBlobResult[] }> {
    if (!isMockMode) {
      throw new Error("Mock Blob called in non-mock mode")
    }

    console.log('📋 Mock Blob: Listing files...')
    
    let blobs = Array.from(mockBlobs.values())
    
    if (options?.prefix) {
      blobs = blobs.filter(blob => blob.pathname.startsWith(options.prefix!))
    }
    
    if (options?.limit) {
      blobs = blobs.slice(0, options.limit)
    }
    
    console.log(`📁 Found ${blobs.length} files`)
    
    return { blobs }
  }
}

// Mock image processing utilities
export function createMockImageUrl(type: 'user' | 'glasses' | 'result', id?: string): string {
  const colors = {
    user: '87CEEB',      // Sky blue
    glasses: '8B4513',   // Saddle brown
    result: '98FB98'     // Pale green
  }
  
  const texts = {
    user: 'User+Photo',
    glasses: 'Glasses+Frame',
    result: 'Try-On+Result'
  }
  
  const suffix = id ? `+${id}` : ''
  return `https://via.placeholder.com/400x400/${colors[type]}/000000?text=${texts[type]}${suffix}`
}

// Mock file validation
export function validateMockFile(file: File): { valid: boolean; error?: string } {
  console.log('🔍 Mock Blob: Validating file...')
  console.log('📄 File name:', file.name)
  console.log('📊 File size:', `${(file.size / 1024).toFixed(2)} KB`)
  console.log('🏷️ File type:', file.type)

  // Simulate validation rules
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please use JPEG, PNG, or WebP.' }
  }

  console.log('✅ Mock Blob: File validation passed')
  return { valid: true }
}

// Convenience function for upload API compatibility
export async function mockBlobUpload(
  filename: string,
  file: File,
  options?: { access?: 'public' | 'private' }
): Promise<MockBlobResult> {
  return MockBlob.put(filename, file, options)
}
