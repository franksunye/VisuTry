import React from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FaceAnalysisActivityTable from '@/components/admin/FaceAnalysisActivityTable';

export const dynamic = 'force-dynamic';

interface FaceAnalysisPageProps {
  searchParams: {
    page?: string;
  };
}

const ITEMS_PER_PAGE = 10;

async function getFaceAnalysisTasks({ page = 1 }: { page?: number }) {
  const currentPage = Math.max(page, 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [tasks, totalTasks] = await Promise.all([
    prisma.faceAnalysisTask.findMany({
      take: ITEMS_PER_PAGE,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        detectedShape: true,
        confidence: true,
        reportUnlocked: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.faceAnalysisTask.count(),
  ]);

  return {
    tasks,
    currentPage,
    totalPages: Math.max(1, Math.ceil(totalTasks / ITEMS_PER_PAGE)),
  };
}

export default async function FaceAnalysisPage({ searchParams }: FaceAnalysisPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const { tasks, currentPage, totalPages } = await getFaceAnalysisTasks({ page });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Face Analysis Activity</h2>
        <p className="text-muted-foreground">View all user face analysis records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Face Analysis</CardTitle>
          <CardDescription>A list of all face analysis records, sorted by most recent</CardDescription>
        </CardHeader>
        <CardContent>
          <FaceAnalysisActivityTable
            tasks={tasks}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
