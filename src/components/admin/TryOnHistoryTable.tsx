'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TryOnDetailDialog from './TryOnDetailDialog';

interface TryOnTask {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TryOnHistoryTableProps {
  tasks: TryOnTask[];
  onTaskDeleted?: () => void;
}

export default function TryOnHistoryTable({ tasks, onTaskDeleted }: TryOnHistoryTableProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewDetails = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDialogOpen(true);
  };

  const handleTaskDeleted = () => {
    setDialogOpen(false);
    setSelectedTaskId(null);
    if (onTaskDeleted) {
      onTaskDeleted();
    }
    // Refresh the page to update the list
    window.location.reload();
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-mono text-xs">
                {task.id.slice(-8)}...
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell className="text-sm">
                {new Date(task.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm">
                {new Date(task.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(task.id)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TryOnDetailDialog
        taskId={selectedTaskId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDeleted={handleTaskDeleted}
      />
    </>
  );
}

