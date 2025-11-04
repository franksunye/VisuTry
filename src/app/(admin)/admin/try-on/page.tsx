import { prisma } from '@/lib/prisma';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { TaskStatus } from '@prisma/client';

interface TryOnPageProps {
  searchParams: {
    page?: string;
  };
}

const ITEMS_PER_PAGE = 10;

async function getTryOnTasks({ page = 1 }: { page?: number }) {
  const currentPage = Math.max(page, 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [tasks, totalTasks] = await Promise.all([
    prisma.tryOnTask.findMany({
      take: ITEMS_PER_PAGE,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.tryOnTask.count(),
  ]);

  const totalPages = Math.ceil(totalTasks / ITEMS_PER_PAGE);

  return {
    tasks,
    currentPage,
    totalPages,
  };
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

export default async function TryOnPage({ searchParams }: TryOnPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const { tasks, currentPage, totalPages } = await getTryOnTasks({ page });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Try-On Activity</h2>
        <p className="text-muted-foreground">
          View all user try-on operations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Try-On Activities</CardTitle>
          <CardDescription>
            A list of all try-on operations, sorted by most recent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No try-on activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{task.user.email}</span>
                          {task.user.name && (
                            <span className="text-sm text-muted-foreground">{task.user.name}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatRelativeTime(task.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/try-on/${task.id}`}
                          className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/admin/try-on?page=${currentPage - 1}`}
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
                  href={`/admin/try-on?page=${currentPage + 1}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
