'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StorageControls from './StorageControls'

type StoreScope = 'public' | 'private'
type StoreSummary = {
  scope: StoreScope
  label: string
  configured: boolean
  totalFiles: number
  totalSizeMB: string
  complete: boolean
  error?: string
}
type StorageStats = {
  totalFiles: number
  totalSizeMB: string
  complete: boolean
  stores: StoreSummary[]
}
type BlobFile = {
  pathname: string
  sizeKB: string
  uploadedAt: string
  url: string | null
}

export default function StorageManager() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [files, setFiles] = useState<BlobFile[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<StoreScope>('public')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalFiles, setTotalFiles] = useState(0)
  const [complete, setComplete] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        const response = await fetch('/api/admin/blob/stats', { cache: 'no-store' })
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load storage')
        if (!cancelled) {
          setStats(result.data)
          setStatsError(null)
        }
      } catch {
        if (!cancelled) setStatsError('Storage statistics are unavailable. Please refresh.')
      }
    }
    void loadStats()
    return () => { cancelled = true }
  }, [refresh])

  useEffect(() => {
    const controller = new AbortController()
    async function loadFiles() {
      setLoading(true)
      setFilesError(null)
      try {
        const params = new URLSearchParams({
          store: scope,
          page: String(currentPage),
          search: debouncedSearch,
        })
        const response = await fetch(`/api/admin/blob/list?${params}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to list files')
        if (!controller.signal.aborted) {
          setFiles(result.data.files)
          setTotalFiles(result.data.total)
          setTotalPages(result.data.totalPages)
          setComplete(result.data.complete)
          setCurrentPage(result.data.currentPage)
        }
      } catch {
        if (!controller.signal.aborted) {
          setFiles([])
          setFilesError('File listing is unavailable for this store.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadFiles()
    return () => controller.abort()
  }, [scope, debouncedSearch, currentPage, refresh])

  const changeScope = (value: StoreScope) => {
    setScope(value)
    setCurrentPage(1)
  }
  const changeSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Read-only inventory of the Public and Private Vercel Blob stores.
          Data deletion is managed by the dedicated retention jobs.
        </p>
        <Button variant="outline" size="sm" onClick={() => setRefresh(value => value + 1)}>
          Refresh
        </Button>
      </div>

      {statsError && <p role="alert" className="text-sm text-destructive">{statsError}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Known Files</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFiles ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${stats.totalSizeMB} MB across configured stores` : 'Loading...'}
            </p>
          </CardContent>
        </Card>
        {(stats?.stores || []).map(store => (
          <Card key={store.scope}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{store.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.configured && !store.error ? store.totalFiles : '—'}</div>
              <p className="text-xs text-muted-foreground">
                {store.error || `${store.totalSizeMB} MB${store.complete ? '' : ' (partial scan)'}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {stats && !stats.complete && (
        <p role="status" className="text-sm text-amber-700">
          Inventory incomplete: unavailable stores or a scan limit prevent a verified project-wide total.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>File Browser</CardTitle>
          <CardDescription>
            Select a store and search file paths. Private object links are intentionally not exposed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <label htmlFor="blob-store" className="text-sm font-medium">Store</label>
            <select
              id="blob-store"
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={scope}
              onChange={event => changeScope(event.target.value as StoreScope)}
            >
              <option value="public">Public Blob</option>
              <option value="private">Private Blob</option>
            </select>
          </div>
          <StorageControls
            searchTerm={searchTerm}
            onSearchChange={changeSearch}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          {filesError && <p role="alert" className="mb-3 text-sm text-destructive">{filesError}</p>}
          {!complete && <p role="status" className="mb-3 text-sm text-amber-700">Partial scan (10,000-file safety limit)</p>}
          <p className="mb-3 text-sm text-muted-foreground">Showing {files.length} of {totalFiles} files</p>
          {loading ? <p className="py-8 text-center">Loading files...</p> : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pathname</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map(file => (
                    <TableRow key={file.pathname}>
                      <TableCell className="max-w-sm break-all font-mono text-xs">{file.pathname}</TableCell>
                      <TableCell className="whitespace-nowrap">{file.sizeKB} KB</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(file.uploadedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {file.url ? (
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View
                          </a>
                        ) : <span className="text-xs text-muted-foreground">Private</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {files.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No files found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
