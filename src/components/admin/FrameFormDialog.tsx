'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Frame {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  brand?: string | null
  model?: string | null
  category?: string | null
  style?: string | null
  material?: string | null
  color?: string | null
  price?: number | null
  isActive: boolean
}

interface FrameFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frame?: Frame | null
  onSuccess: () => void
}

const CATEGORIES = [
  'prescription',
  'sunglasses',
  'reading',
  'computer',
  'sports',
  'fashion',
  'vintage',
  'designer',
  'budget',
  'premium',
]

const STYLES = [
  'aviator',
  'wayfarer',
  'cat-eye',
  'round',
  'square',
  'oval',
  'clubmaster',
  'browline',
  'rimless',
  'oversized',
  'geometric',
  'butterfly',
  'keyhole',
]

const MATERIALS = [
  'acetate',
  'metal',
  'plastic',
  'titanium',
  'stainless-steel',
  'aluminum',
  'wood',
  'bamboo',
  'carbon-fiber',
  'mixed',
]

export function FrameFormDialog({
  open,
  onOpenChange,
  frame,
  onSuccess,
}: FrameFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    imageUrl: '',
    brand: '',
    model: '',
    category: '',
    style: '',
    material: '',
    color: '',
    price: '',
    isActive: true,
  })

  const isEdit = !!frame

  useEffect(() => {
    if (frame) {
      setFormData({
        id: frame.id,
        name: frame.name,
        description: frame.description || '',
        imageUrl: frame.imageUrl || '',
        brand: frame.brand || '',
        model: frame.model || '',
        category: frame.category || '',
        style: frame.style || '',
        material: frame.material || '',
        color: frame.color || '',
        price: frame.price ? String(frame.price) : '',
        isActive: frame.isActive,
      })
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        imageUrl: '',
        brand: '',
        model: '',
        category: '',
        style: '',
        material: '',
        color: '',
        price: '',
        isActive: true,
      })
    }
    setError(null)
  }, [frame, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit
        ? `/api/admin/frames/${frame.id}`
        : '/api/admin/frames'
      
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save frame')
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Frame' : 'Create New Frame'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the frame details below.'
              : 'Fill in the details to create a new frame.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">
                ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., rayban-aviator-01"
                required
                disabled={isEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ray-Ban Aviator Classic"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Frame description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Ray-Ban"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., Aviator 01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select
                value={formData.style}
                onValueChange={(value) => setFormData({ ...formData, style: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Select
                value={formData.material}
                onValueChange={(value) => setFormData({ ...formData, material: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map((mat) => (
                    <SelectItem key={mat} value={mat}>
                      {mat.charAt(0).toUpperCase() + mat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., Black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (visible on website)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Frame' : 'Create Frame'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

