'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface TryOnTask {
  id: string;
  userId: string;
  userImageUrl: string;
  glassesImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
}

interface TryOnDetailDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export default function TryOnDetailDialog({
  taskId,
  open,
  onOpenChange,
  onDeleted,
}: TryOnDetailDialogProps) {
  const [task, setTask] = useState<TryOnTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showImages, setShowImages] = useState(false);

  // 加载任务详情
  useEffect(() => {
    if (open && taskId) {
      loadTask();
    }
  }, [open, taskId]);

  const loadTask = async () => {
    if (!taskId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/try-on/${taskId}`);
      const data = await response.json();
      if (data.success) {
        setTask(data.data);
      }
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除任务
  const handleDelete = async () => {
    if (!taskId) return;
    if (!confirm('Are you sure you want to delete this try-on task and all associated files?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/try-on/${taskId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully deleted task and ${data.data.deletedFiles} files`);
        onOpenChange(false);
        if (onDeleted) onDeleted();
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Try-On Task Details</DialogTitle>
          <DialogDescription>
            Task ID: {task.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 任务状态 */}
          <div>
            <h3 className="text-sm font-medium mb-2">Status</h3>
            <Badge
              variant={
                task.status === 'COMPLETED' ? 'default' :
                task.status === 'PROCESSING' ? 'secondary' :
                task.status === 'FAILED' ? 'destructive' :
                'outline'
              }
            >
              {task.status}
            </Badge>
            {task.errorMessage && (
              <p className="text-sm text-red-600 mt-2">{task.errorMessage}</p>
            )}
          </div>

          {/* 用户信息 */}
          <div>
            <h3 className="text-sm font-medium mb-2">User Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {task.user.name || 'N/A'}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span> {task.user.email}
              </div>
              <div>
                <span className="text-muted-foreground">User ID:</span>{' '}
                <span className="font-mono text-xs">{task.user.id}</span>
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div>
            <h3 className="text-sm font-medium mb-2">Timeline</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>{' '}
                {new Date(task.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{' '}
                {new Date(task.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 图片 URL */}
          <div>
            <h3 className="text-sm font-medium mb-2">Image URLs</h3>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-muted-foreground">User Image:</span>
                <br />
                <a
                  href={task.userImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {task.userImageUrl}
                </a>
              </div>
              <div>
                <span className="text-muted-foreground">Glasses Image:</span>
                <br />
                <a
                  href={task.glassesImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {task.glassesImageUrl}
                </a>
              </div>
              {task.resultImageUrl && (
                <div>
                  <span className="text-muted-foreground">Result Image:</span>
                  <br />
                  <a
                    href={task.resultImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {task.resultImageUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 图片预览 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Image Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImages(!showImages)}
              >
                {showImages ? 'Hide Images' : 'Show Images'}
              </Button>
            </div>

            {showImages && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">User Image</p>
                  <div className="relative aspect-square border rounded overflow-hidden">
                    <Image
                      src={task.userImageUrl}
                      alt="User"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Glasses Image</p>
                  <div className="relative aspect-square border rounded overflow-hidden">
                    <Image
                      src={task.glassesImageUrl}
                      alt="Glasses"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                {task.resultImageUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Result Image</p>
                    <div className="relative aspect-square border rounded overflow-hidden">
                      <Image
                        src={task.resultImageUrl}
                        alt="Result"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Task & Files'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

