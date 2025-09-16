import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUpload } from '@/components/upload/ImageUpload'

// Mock image utilities
jest.mock('@/utils/image', () => ({
  validateImageFile: jest.fn(),
  compressImage: jest.fn(),
  createImagePreview: jest.fn()
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: ({ className }: { className?: string }) => <div data-testid="upload-icon" className={className} />,
  X: ({ className }: { className?: string }) => <div data-testid="x-icon" className={className} />,
  Image: ({ className }: { className?: string }) => <div data-testid="image-icon" className={className} />,
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className} />
}))

// Mock window.alert
const mockAlert = jest.fn()
global.alert = mockAlert

import { validateImageFile, compressImage, createImagePreview } from '@/utils/image'

const mockValidateImageFile = validateImageFile as jest.MockedFunction<typeof validateImageFile>
const mockCompressImage = compressImage as jest.MockedFunction<typeof compressImage>
const mockCreateImagePreview = createImagePreview as jest.MockedFunction<typeof createImagePreview>

describe('ImageUpload', () => {
  const mockOnImageSelect = jest.fn()
  const mockOnImageRemove = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateImageFile.mockReturnValue({ valid: true })
    mockCompressImage.mockResolvedValue(new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' }))
    mockCreateImagePreview.mockResolvedValue('data:image/jpeg;base64,preview')
  })

  describe('Initial Render', () => {
    it('should render upload area with default props', () => {
      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      expect(screen.getByText('Upload Image')).toBeInTheDocument()
      expect(screen.getByText('Supports JPEG, PNG, WebP formats, max 5MB')).toBeInTheDocument()
      expect(screen.getByText('Click or drag to upload image')).toBeInTheDocument()
      expect(screen.getByTestId('image-icon')).toBeInTheDocument()
    })

    it('should render with custom label and description', () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          label="Custom Label"
          description="Custom description"
        />
      )

      expect(screen.getByText('Custom Label')).toBeInTheDocument()
      expect(screen.getByText('Custom description')).toBeInTheDocument()
    })

    it('should not render label when not provided', () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          label=""
        />
      )

      expect(screen.queryByRole('label')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          className="custom-class"
        />
      )

      const container = screen.getByText('Upload Image').closest('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('File Selection via Click', () => {
    it('should trigger file input when upload area is clicked', async () => {
      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const uploadArea = screen.getByText('Click or drag to upload image').closest('div')
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      // Mock file input click
      const clickSpy = jest.spyOn(fileInput, 'click')

      fireEvent.click(uploadArea!)

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should process selected file successfully', async () => {
      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await user.upload(fileInput, testFile)

      await waitFor(() => {
        expect(mockValidateImageFile).toHaveBeenCalledWith(testFile)
        expect(mockCompressImage).toHaveBeenCalledWith(testFile)
        expect(mockCreateImagePreview).toHaveBeenCalled()
        expect(mockOnImageSelect).toHaveBeenCalled()
      })
    })

    it('should show alert when file validation fails', async () => {
      mockValidateImageFile.mockReturnValue({ valid: false, error: 'File too large' })

      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await user.upload(fileInput, testFile)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('File too large')
        expect(mockOnImageSelect).not.toHaveBeenCalled()
      })
    })

    it('should handle image processing errors', async () => {
      mockCompressImage.mockRejectedValue(new Error('Compression failed'))

      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await user.upload(fileInput, testFile)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Image processing failed, please try again')
        expect(mockOnImageSelect).not.toHaveBeenCalled()
      })
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag over events', () => {
      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const uploadArea = screen.getByText('Click or drag to upload image').closest('div')
      
      fireEvent.dragOver(uploadArea!, {
        dataTransfer: { files: [] }
      })

      expect(screen.getByText('Drop to upload image')).toBeInTheDocument()
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument()
    })

    it('should handle drag leave events', () => {
      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const uploadArea = screen.getByText('Click or drag to upload image').closest('div')
      
      // First drag over
      fireEvent.dragOver(uploadArea!, {
        dataTransfer: { files: [] }
      })
      
      // Then drag leave
      fireEvent.dragLeave(uploadArea!, {
        dataTransfer: { files: [] }
      })

      expect(screen.getByText('Click or drag to upload image')).toBeInTheDocument()
      expect(screen.getByTestId('image-icon')).toBeInTheDocument()
    })

    it('should handle file drop', async () => {
      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const uploadArea = screen.getByText('Click or drag to upload image').closest('div')
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(uploadArea!, {
        dataTransfer: { files: [testFile] }
      })

      await waitFor(() => {
        expect(mockValidateImageFile).toHaveBeenCalledWith(testFile)
        expect(mockOnImageSelect).toHaveBeenCalled()
      })
    })

    it('should ignore drop events with no files', () => {
      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const uploadArea = screen.getByText('Click or drag to upload image').closest('div')
      
      fireEvent.drop(uploadArea!, {
        dataTransfer: { files: [] }
      })

      expect(mockValidateImageFile).not.toHaveBeenCalled()
      expect(mockOnImageSelect).not.toHaveBeenCalled()
    })
  })

  describe('Current Image Display', () => {
    it('should display current image when provided', () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          currentImage="https://example.com/image.jpg"
        />
      )

      const image = screen.getByAltText('Uploaded image')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })

    it('should call onImageRemove when remove button is clicked', async () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          currentImage="https://example.com/image.jpg"
        />
      )

      const removeButton = screen.getByRole('button')
      await user.click(removeButton)

      expect(mockOnImageRemove).toHaveBeenCalled()
    })

    it('should prevent event propagation when remove button is clicked', async () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          currentImage="https://example.com/image.jpg"
        />
      )

      const removeButton = screen.getByRole('button')
      const clickSpy = jest.fn()
      
      removeButton.parentElement!.addEventListener('click', clickSpy)
      
      await user.click(removeButton)

      expect(clickSpy).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading state when loading prop is true', () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          loading={true}
        />
      )

      expect(screen.getByText('Processing image...')).toBeInTheDocument()
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
    })

    it('should show loading overlay on current image when loading', () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          currentImage="https://example.com/image.jpg"
          loading={true}
        />
      )

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      expect(screen.getByAltText('Uploaded image')).toBeInTheDocument()
    })

    it('should disable interactions when loading', () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          loading={true}
        />
      )

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeDisabled()
    })

    it('should show uploading state during file processing', async () => {
      // Make compression take some time
      mockCompressImage.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve(new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' })), 100)
      ))

      render(<ImageUpload onImageSelect={mockOnImageSelect} onImageRemove={mockOnImageRemove} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await user.upload(fileInput, testFile)

      // Should show processing state
      expect(screen.getByText('Processing image...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalled()
      })
    })
  })

  describe('Custom Accept Types', () => {
    it('should use custom accept attribute', () => {
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          accept="image/png,image/gif"
        />
      )

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toHaveAttribute('accept', 'image/png,image/gif')
    })
  })
})
