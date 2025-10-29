'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ImportPage() {
  const [mode, setMode] = useState<'create' | 'upsert'>('create')
  const [jsonData, setJsonData] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        // Validate JSON
        JSON.parse(content)
        setJsonData(content)
        setError(null)
      } catch (err) {
        setError('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const frames = JSON.parse(jsonData)

      if (!Array.isArray(frames)) {
        throw new Error('JSON must be an array of frames')
      }

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frames,
          mode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data.results)
      setJsonData('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exampleData = [
    {
      id: 'example-frame-01',
      name: 'Example Frame 01',
      description: 'This is an example frame',
      imageUrl: 'https://example.com/image.jpg',
      brand: 'Example Brand',
      model: 'Model 01',
      category: 'sunglasses',
      style: 'aviator',
      material: 'metal',
      color: 'gold',
      price: 99.99,
      isActive: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bulk Import Frames</h2>
        <p className="text-muted-foreground">
          Import multiple frames from JSON file or paste JSON data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>
              Upload a JSON file or paste JSON data below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label>Import Mode</Label>
              <Select value={mode} onValueChange={(value: any) => setMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">
                    Create Only (skip existing)
                  </SelectItem>
                  <SelectItem value="upsert">
                    Create or Update (upsert)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {mode === 'create'
                  ? 'Only create new frames, skip frames with existing IDs'
                  : 'Create new frames or update existing ones'}
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Upload JSON File</Label>
              <div className="flex items-center gap-2">
                <input
                  id="file"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file')?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose JSON File
                </Button>
              </div>
            </div>

            {/* JSON Textarea */}
            <div className="space-y-2">
              <Label htmlFor="json">Or Paste JSON Data</Label>
              <Textarea
                id="json"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder="Paste JSON array here..."
                rows={12}
                className="font-mono text-xs"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Import Completed</p>
                    <div className="text-sm mt-2 space-y-1">
                      <p>Total: {result.total}</p>
                      <p>Created: {result.created}</p>
                      <p>Updated: {result.updated}</p>
                      <p>Skipped: {result.skipped}</p>
                      {result.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">Errors:</p>
                          <ul className="list-disc list-inside text-xs">
                            {result.errors.slice(0, 5).map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                            ))}
                            {result.errors.length > 5 && (
                              <li>... and {result.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={!jsonData || loading}
              className="w-full"
            >
              {loading ? 'Importing...' : 'Import Frames'}
            </Button>
          </CardContent>
        </Card>

        {/* Example & Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>
              <FileJson className="inline-block mr-2 h-5 w-5" />
              JSON Format Example
            </CardTitle>
            <CardDescription>
              Your JSON file should be an array of frame objects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Required Fields:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li><code className="text-xs bg-gray-100 px-1 rounded">id</code> - Unique identifier (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">name</code> - Frame name (string)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Optional Fields:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li><code className="text-xs bg-gray-100 px-1 rounded">description</code> - Description (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">imageUrl</code> - Image URL (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">brand</code> - Brand name (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">model</code> - Model name (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">category</code> - Category (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">style</code> - Style (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">material</code> - Material (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">color</code> - Color (string)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">price</code> - Price (number)</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">isActive</code> - Active status (boolean)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Example:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(exampleData, null, 2)}
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              <p className="font-semibold mb-1">💡 Tip</p>
              <p>You can export existing frames from <code className="bg-blue-100 px-1 rounded">data/models.json</code> as a reference.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

