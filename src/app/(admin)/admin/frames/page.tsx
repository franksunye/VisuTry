'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FrameFormDialog } from '@/components/admin/FrameFormDialog'
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Frame {
  id: string
  name: string
  brand?: string | null
  model?: string | null
  category?: string | null
  price?: number | null
  description?: string | null
  imageUrl?: string | null
  style?: string | null
  material?: string | null
  color?: string | null
  isActive: boolean
  createdAt: string
}

const ITEMS_PER_PAGE = 20

export default function FramesPage() {
  const [frames, setFrames] = useState<Frame[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [totalFrames, setTotalFrames] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchFrames()
  }, [page, search])

  async function fetchFrames() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: search,
      })

      const response = await fetch(`/api/admin/frames?${params}`)
      const data = await response.json()

      setFrames(data.frames)
      setTotalPages(data.totalPages)
      setTotalFrames(data.total)
    } catch (error) {
      console.error('Error fetching frames:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleCreate = () => {
    setSelectedFrame(null)
    setFormOpen(true)
  }

  const handleEdit = (frame: Frame) => {
    setSelectedFrame(frame)
    setFormOpen(true)
  }

  const handleDelete = (frame: Frame) => {
    setSelectedFrame(frame)
    setDeleteOpen(true)
  }

  const handleSuccess = (message: string) => {
    setSuccessMessage(message)
    fetchFrames()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Frames Management</h2>
          <p className="text-muted-foreground">
            Manage glasses frames for programmatic SEO
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Frame
        </Button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Frames</CardTitle>
          <CardDescription>
            Total: {totalFrames} frames
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, brand, or model..."
              value={search}
              onChange={handleSearch}
              className="flex-1"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {frames.map((frame) => (
                      <TableRow key={frame.id}>
                        <TableCell className="font-medium">{frame.name}</TableCell>
                        <TableCell>{frame.brand || '-'}</TableCell>
                        <TableCell>{frame.model || '-'}</TableCell>
                        <TableCell>{frame.category || '-'}</TableCell>
                        <TableCell>
                          {frame.price ? `$${frame.price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={frame.isActive ? 'default' : 'secondary'}>
                            {frame.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(frame.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(frame)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(frame)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <FrameFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        frame={selectedFrame}
        onSuccess={() => handleSuccess(selectedFrame ? 'Frame updated successfully' : 'Frame created successfully')}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        frameId={selectedFrame?.id || ''}
        frameName={selectedFrame?.name || ''}
        onSuccess={() => handleSuccess('Frame deleted successfully')}
      />
    </div>
  )
}

