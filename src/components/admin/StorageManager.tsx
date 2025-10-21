'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StorageControls from './StorageControls';

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  totalSizeMB: string;
  orphanedFiles: number;
  orphanedSize: number;
  orphanedSizeMB: string;
  referencedFiles: number;
  filesByType: Record<string, number>;
  topUsers: Array<{ userId: string; count: number }>;
}

interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  sizeMB: string;
  uploadedAt: string;
  downloadUrl: string;
}

export default function StorageManager() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrphaned, setShowOrphaned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/blob/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // 加载文件列表
  const loadFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showOrphaned) params.set('orphaned', 'true');
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', currentPage.toString());

      const response = await fetch(`/api/admin/blob/list?${params}`);
      const data = await response.json();
      if (data.success) {
        setFiles(data.data.files);
        setTotalPages(data.data.totalPages);
        setTotalFiles(data.data.total);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadStats();
  }, []);

  // 当筛选条件或分页改变时重新加载
  useEffect(() => {
    loadFiles();
  }, [showOrphaned, searchTerm, currentPage]);

  // 搜索改变时重置到第一页
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 切换筛选时重置到第一页
  const handleToggleOrphaned = () => {
    setShowOrphaned(!showOrphaned);
    setCurrentPage(1);
  };

  // 页码改变
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedFiles(new Set()); // 清空选择
  };

  // 切换文件选择
  const toggleFileSelection = (url: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedFiles(newSelected);
  };

  // 全选/取消全选（当前页）
  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.url)));
    }
  };

  // 删除选中的文件
  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/blob/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: Array.from(selectedFiles) }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully deleted ${data.data.deleted} files`);
        setSelectedFiles(new Set());
        setShowDeleteDialog(false);
        await loadStats();
        await loadFiles();
      } else {
        alert(`Failed to delete files: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to delete files:', error);
      alert('Failed to delete files');
    } finally {
      setIsDeleting(false);
    }
  };

  // 预览清理
  const handleCleanupPreview = async () => {
    try {
      const response = await fetch('/api/admin/blob/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      });

      const data = await response.json();
      if (data.success) {
        setCleanupPreview(data.data);
        setShowCleanupDialog(true);
      }
    } catch (error) {
      console.error('Failed to preview cleanup:', error);
    }
  };

  // 执行清理
  const handleCleanupExecute = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/blob/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully cleaned up ${data.data.deletedCount} orphaned files (${data.data.orphanedSizeMB} MB)`);
        setShowCleanupDialog(false);
        setCleanupPreview(null);
        await loadStats();
        await loadFiles();
      } else {
        alert(`Failed to cleanup: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to cleanup:', error);
      alert('Failed to cleanup orphaned files');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSizeMB} MB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referenced Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.referencedFiles}</div>
            <p className="text-xs text-muted-foreground">
              In database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orphaned Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.orphanedFiles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.orphanedSizeMB} MB wasted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSizeMB} MB</div>
            <p className="text-xs text-muted-foreground">
              {((parseFloat(stats.totalSizeMB) / 1024) * 100).toFixed(1)}% of 1GB free tier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 文件管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>File Management</CardTitle>
              <CardDescription>
                Browse and manage all files in Blob Storage
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleOrphaned}
              >
                {showOrphaned ? 'Show All' : 'Show Orphaned Only'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCleanupPreview}
                disabled={stats.orphanedFiles === 0}
              >
                Cleanup Orphaned Files
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和分页控件 */}
          <StorageControls
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />

          {/* 操作栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {files.length} of {totalFiles} files
            </div>
            <div className="flex items-center space-x-2">
              {selectedFiles.size > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedFiles.size} selected
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Selected
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 文件列表 */}
          {loading ? (
            <div className="text-center py-8">Loading files...</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === files.length && files.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Pathname</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.url}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.url)}
                          onChange={() => toggleFileSelection(file.url)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {file.pathname}
                      </TableCell>
                      <TableCell>{file.sizeMB} MB</TableCell>
                      <TableCell className="text-sm">
                        {new Date(file.uploadedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Files</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedFiles.size} file(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清理预览对话框 */}
      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cleanup Orphaned Files</DialogTitle>
            <DialogDescription>
              The following files are not referenced in the database and can be safely deleted.
            </DialogDescription>
          </DialogHeader>
          {cleanupPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Files to delete:</p>
                  <p className="text-2xl font-bold">{cleanupPreview.orphanedFiles}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Space to free:</p>
                  <p className="text-2xl font-bold">{cleanupPreview.orphanedSizeMB} MB</p>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded p-2">
                {cleanupPreview.files.slice(0, 20).map((file: any) => (
                  <div key={file.url} className="text-xs font-mono py-1">
                    {file.pathname}
                  </div>
                ))}
                {cleanupPreview.files.length > 20 && (
                  <div className="text-xs text-muted-foreground py-1">
                    ... and {cleanupPreview.files.length - 20} more files
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCleanupDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCleanupExecute}
              disabled={isDeleting}
            >
              {isDeleting ? 'Cleaning up...' : 'Cleanup Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

