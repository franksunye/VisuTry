import React from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { User } from 'lucide-react';

// This is a React Server Component (RSC) to display the admin dashboard.
// It fetches data directly on the server to provide key metrics.

// Force dynamic rendering to always show the latest data
export const dynamic = 'force-dynamic';

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch key metrics in parallel for efficiency
  const [
    totalUsers,
    todayUsers,
    totalFaceShapeDetections,
    todayFaceShapeDetections,
    totalFaceAnalyses,
    todayFaceAnalyses,
    recentUsers,
    recentFaceAnalyses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.faceShapeDetection.count(),
    prisma.faceShapeDetection.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.faceAnalysisTask.count(),
    prisma.faceAnalysisTask.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        image: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.faceAnalysisTask.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        detectedShape: true,
        confidence: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    totalUsers,
    todayUsers,
    totalFaceShapeDetections,
    todayFaceShapeDetections,
    totalFaceAnalyses,
    todayFaceAnalyses,
    recentUsers,
    recentFaceAnalyses,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your business metrics and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.todayUsers} today
            </p>
          </CardContent>
        </Card>

        {/* Face Shape Detections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Face Shape Detections</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
              <path d="M9 10h.01M15 10h.01M9.5 15a4 4 0 0 0 5 0" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaceShapeDetections}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.todayFaceShapeDetections} today
            </p>
          </CardContent>
        </Card>

        {/* Face Analyses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Face Analyses</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" x2="9.01" y1="9" y2="9" />
              <line x1="15" x2="15.01" y1="9" y2="9" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaceAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.todayFaceAnalyses} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest 5 user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || 'User'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="hover:underline"
                      >
                        {user.name || 'N/A'}
                      </Link>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Face Analyses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Face Analyses</CardTitle>
            <CardDescription>Latest 5 face analysis records</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentFaceAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No face analysis records yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Shape</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentFaceAnalyses.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/users/${task.userId}`}
                          className="hover:underline"
                        >
                          {task.user.name || task.user.email}
                        </Link>
                      </TableCell>
                      <TableCell>{task.detectedShape || '—'}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4">
              <Link href="/admin/face-analysis" className="text-sm text-blue-600 hover:underline">
                View all →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
