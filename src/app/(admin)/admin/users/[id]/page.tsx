import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import TryOnHistoryTable from '@/components/admin/TryOnHistoryTable';
import { User } from 'lucide-react';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 20, // Show last 20 orders
      },
      tryOnTasks: {
        orderBy: { createdAt: 'desc' },
        take: 10, // Show last 10 try-on tasks
      },
    },
  });

  if (!user) {
    return null;
  }

  // Calculate user statistics
  const totalSpent = user.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0) / 100;

  const completedOrders = user.payments.filter(p => p.status === 'COMPLETED').length;
  const pendingOrders = user.payments.filter(p => p.status === 'PENDING').length;

  return {
    user,
    stats: {
      totalSpent,
      completedOrders,
      pendingOrders,
      totalTryOns: user.tryOnTasks.length,
    },
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const data = await getUserDetails(params.id);

  if (!data) {
    notFound();
  }

  const { user, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Details</h2>
          <p className="text-muted-foreground">
            Detailed information about {user.name || user.email}
          </p>
        </div>
        <Link href="/admin/users">
          <button className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
            ← Back to Users
          </button>
        </Link>
      </div>

      {/* User Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Try-On Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTryOns}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Display */}
          <div className="flex items-center space-x-4 pb-4 border-b">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avatar</p>
              <p className="text-sm">{user.image ? 'User has avatar' : 'No avatar'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">User ID</p>
              <p className="text-sm font-mono">{user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
              <p className="text-sm">
                {user.emailVerified ? new Date(user.emailVerified).toLocaleDateString() : 'Not verified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Joined</p>
              <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Premium Status</p>
              <Badge variant={user.isPremium ? 'default' : 'secondary'}>
                {user.isPremium ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Free Trials Used</p>
              <p className="text-sm">{user.freeTrialsUsed}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credits</p>
              <p className="text-sm">{(user.creditsPurchased || 0) - (user.creditsUsed || 0)}/{user.creditsPurchased || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Premium Usage</p>
              <p className="text-sm">{user.premiumUsageCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All payment transactions for this user</CardDescription>
        </CardHeader>
        <CardContent>
          {user.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment history</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.id.slice(-8)}...
                    </TableCell>
                    <TableCell>{payment.productType.replace(/_/g, ' ')}</TableCell>
                    <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === 'COMPLETED' ? 'default' :
                          payment.status === 'PENDING' ? 'secondary' :
                          payment.status === 'REFUNDED' ? 'outline' :
                          'destructive'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/admin/orders/${payment.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Try-On History */}
      <Card>
        <CardHeader>
          <CardTitle>Try-On History</CardTitle>
          <CardDescription>Recent virtual try-on tasks with image preview</CardDescription>
        </CardHeader>
        <CardContent>
          {user.tryOnTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No try-on history</p>
          ) : (
            <TryOnHistoryTable tasks={user.tryOnTasks} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

