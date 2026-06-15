'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TaskStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFaceShapeIcon } from '@/config/face-analysis';
import FaceAnalysisDetailDialog from '@/components/admin/FaceAnalysisDetailDialog';

interface Task {
  id: string;
  userId: string;
  detectedShape: string | null;
  confidence: number | null;
  reportUnlocked: boolean;
  status: TaskStatus;
  createdAt: Date;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
}

interface FaceAnalysisActivityTableProps {
  tasks: Task[];
  currentPage: number;
  totalPages: number;
}

function getStatusColor(status: TaskStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'PROCESSING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PENDING':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default function FaceAnalysisActivityTable({
  tasks,
  currentPage,
  totalPages,
}: FaceAnalysisActivityTableProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Face Shape</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No face analysis records found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const ShapeIcon = task.detectedShape
                  ? getFaceShapeIcon(task.detectedShape)
                  : null;

                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/users/${task.user.id}`}
                          className="font-medium hover:underline"
                        >
                          {task.user.email || 'N/A'}
                        </Link>
                        {task.user.name && (
                          <span className="text-sm text-muted-foreground">{task.user.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatRelativeTime(task.createdAt)}
                    </TableCell>
                    <TableCell>
                      {task.detectedShape ? (
                        <Badge variant="outline" className="gap-1">
                          {ShapeIcon && <ShapeIcon className="w-3 h-3" />}
                          {task.detectedShape}
                          {task.confidence != null && (
                            <span className="text-muted-foreground ml-1">
                              ({Math.round(task.confidence * 100)}%)
                            </span>
                          )}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setDialogOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Link
              href={`/admin/face-analysis?page=${currentPage - 1}`}
              className="px-4 py-2 rounded border text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
            >
              Previous
            </Link>
          ) : (
            <span className="px-4 py-2 rounded border text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
              Previous
            </span>
          )}
          {currentPage < totalPages ? (
            <Link
              href={`/admin/face-analysis?page=${currentPage + 1}`}
              className="px-4 py-2 rounded border text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
            >
              Next
            </Link>
          ) : (
            <span className="px-4 py-2 rounded border text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
              Next
            </span>
          )}
        </div>
      </div>

      <FaceAnalysisDetailDialog
        taskId={selectedTaskId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDeleted={() => router.refresh()}
      />
    </>
  );
}
