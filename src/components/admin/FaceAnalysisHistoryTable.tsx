'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFaceShapeIcon } from '@/config/face-analysis';
import FaceAnalysisDetailDialog from '@/components/admin/FaceAnalysisDetailDialog';

interface FaceAnalysisTask {
  id: string;
  detectedShape: string | null;
  confidence: number | null;
  reportUnlocked: boolean;
  status: string;
  createdAt: Date;
}

interface FaceAnalysisHistoryTableProps {
  tasks: FaceAnalysisTask[];
}

export default function FaceAnalysisHistoryTable({ tasks }: FaceAnalysisHistoryTableProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTaskDeleted = () => {
    setDialogOpen(false);
    setSelectedTaskId(null);
    window.location.reload();
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task ID</TableHead>
            <TableHead>Face Shape</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Report</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const ShapeIcon = task.detectedShape ? getFaceShapeIcon(task.detectedShape) : null;

            return (
              <TableRow key={task.id}>
                <TableCell className="font-mono text-xs">{task.id.slice(-8)}...</TableCell>
                <TableCell>
                  {task.detectedShape ? (
                    <Badge variant="outline" className="gap-1">
                      {ShapeIcon && <ShapeIcon className="w-3 h-3" />}
                      {task.detectedShape}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <Badge variant={task.reportUnlocked ? 'default' : 'secondary'}>
                    {task.reportUnlocked ? 'Unlocked' : 'Locked'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(task.createdAt).toLocaleDateString()}
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
          })}
        </TableBody>
      </Table>

      <FaceAnalysisDetailDialog
        taskId={selectedTaskId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDeleted={handleTaskDeleted}
      />
    </>
  );
}
