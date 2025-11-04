import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';

interface TryOnDetailPageProps {
  params: {
    taskId: string;
  };
}

function getStatusColor(status: string) {
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleString();
}

export default async function TryOnDetailPage({ params }: TryOnDetailPageProps) {
  const task = await prisma.tryOnTask.findUnique({
    where: { id: params.taskId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Try-On Details</h2>
          <p className="text-muted-foreground">
            Task ID: {task.id}
          </p>
        </div>
        <Link
          href="/admin/try-on"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
        >
          Back to List
        </Link>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{task.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{task.user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User Created</p>
              <p className="font-medium">{formatDate(task.user.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Information */}
      <Card>
        <CardHeader>
          <CardTitle>Task Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={`mt-1 ${getStatusColor(task.status)}`}>
                {task.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">{formatDate(task.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Updated At</p>
              <p className="font-medium">{formatDate(task.updatedAt)}</p>
            </div>
          </div>

          {task.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                <span className="font-medium">Error:</span> {task.errorMessage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Image</CardTitle>
          </CardHeader>
          <CardContent>
            {task.userImageUrl ? (
              <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden">
                <Image
                  src={task.userImageUrl}
                  alt="User Image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </CardContent>
        </Card>

        {/* Glasses Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Glasses Image</CardTitle>
          </CardHeader>
          <CardContent>
            {task.glassesImageUrl ? (
              <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden">
                <Image
                  src={task.glassesImageUrl}
                  alt="Glasses Image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Result Image</CardTitle>
          </CardHeader>
          <CardContent>
            {task.resultImageUrl ? (
              <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden">
                <Image
                  src={task.resultImageUrl}
                  alt="Result Image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center text-muted-foreground">
                {task.status === 'COMPLETED' ? 'No result' : 'Not available'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
