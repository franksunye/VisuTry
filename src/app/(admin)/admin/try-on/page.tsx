import { prisma } from '@/lib/prisma';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TryOnActivityTable from '@/components/admin/TryOnActivityTable';

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
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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
          <TryOnActivityTable
            tasks={tasks}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
