'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
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
import { getFaceShapeIcon } from '@/config/face-analysis';
import type { FaceAnalysisBasicResult, FaceAnalysisFullResult } from '@/types/face-analysis';

interface FaceAnalysisTaskDetail {
  id: string;
  userId: string;
  userImageUrl: string;
  status: string;
  detectedShape: string | null;
  confidence: number | null;
  basicResult: FaceAnalysisBasicResult | null;
  fullResult: FaceAnalysisFullResult | null;
  reportUnlocked: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown> | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: string;
  };
}

interface FaceAnalysisDetailDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export default function FaceAnalysisDetailDialog({
  taskId,
  open,
  onOpenChange,
  onDeleted,
}: FaceAnalysisDetailDialogProps) {
  const [task, setTask] = useState<FaceAnalysisTaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (!open || !taskId) {
      setTask(null);
      setError(null);
      setShowImage(false);
      return;
    }

    let cancelled = false;
    setTask(null);
    setError(null);
    setLoading(true);

    fetch(`/api/admin/face-analysis/${taskId}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;

        if (data.success) {
          setTask(data.data);
        } else {
          setError(data.error || 'Failed to load task details');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load task details');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, taskId]);

  const handleDelete = async () => {
    if (!taskId) return;
    if (!confirm('Are you sure you want to delete this face analysis task and its image?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/face-analysis/${taskId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        onOpenChange(false);
        onDeleted?.();
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (deleteError) {
      console.error('Failed to delete task:', deleteError);
      alert('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
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

  if (error || !task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unable to load task</DialogTitle>
            <DialogDescription>{error || 'Task not found'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const basic = task.basicResult;
  const full = task.fullResult;
  const ShapeIcon = task.detectedShape ? getFaceShapeIcon(task.detectedShape) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Face Analysis Details</DialogTitle>
          <DialogDescription>Task ID: {task.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Status</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  task.status === 'COMPLETED'
                    ? 'default'
                    : task.status === 'FAILED'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {task.status}
              </Badge>
              {task.detectedShape && (
                <Badge variant="outline" className="gap-1">
                  {ShapeIcon && <ShapeIcon className="w-3 h-3" />}
                  {task.detectedShape}
                </Badge>
              )}
              {task.confidence != null && (
                <Badge variant="outline">{Math.round(task.confidence * 100)}% confidence</Badge>
              )}
              <Badge variant={task.reportUnlocked ? 'default' : 'secondary'}>
                {task.reportUnlocked ? 'Report Unlocked' : 'Report Locked'}
              </Badge>
            </div>
            {task.errorMessage && (
              <p className="text-sm text-red-600 mt-2">{task.errorMessage}</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">User</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {task.user.name || 'N/A'}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span> {task.user.email || 'N/A'}
              </div>
            </div>
          </div>

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

          {basic && (
            <div>
              <h3 className="text-sm font-medium mb-2">Basic Result</h3>
              <p className="text-sm text-muted-foreground">{basic.summary}</p>
              {basic.keyFeatures.length > 0 && (
                <ul className="mt-2 text-sm list-disc list-inside text-muted-foreground">
                  {basic.keyFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {full && (
            <div>
              <h3 className="text-sm font-medium mb-2">Full Report</h3>
              {full.styleGuide && (
                <p className="text-sm text-muted-foreground mb-2">{full.styleGuide}</p>
              )}
              {full.bestFrames && full.bestFrames.length > 0 && (
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">Best frames: </span>
                  {full.bestFrames.join(', ')}
                </div>
              )}
              {full.framesToAvoid && full.framesToAvoid.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Avoid: </span>
                  {full.framesToAvoid.join(', ')}
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">User Photo</h3>
              <Button variant="outline" size="sm" onClick={() => setShowImage(!showImage)}>
                {showImage ? 'Hide Image' : 'Show Image'}
              </Button>
            </div>
            {showImage && (
              <div className="relative aspect-square max-w-xs border rounded overflow-hidden">
                <Image
                  src={task.userImageUrl}
                  alt="User"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Task & Image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
