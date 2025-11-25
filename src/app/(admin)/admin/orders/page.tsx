import { prisma } from '@/lib/prisma';
import React from 'react';
import OrderControls from '@/components/admin/OrderControls';
import { PaymentStatus } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

// This is a React Server Component (RSC) to display the order management page.
// It fetches a paginated list of orders from the database.

interface OrdersPageProps {
  searchParams: {
    page?: string;
    status?: string;
  };
}

const ITEMS_PER_PAGE = 10;

async function getOrders({ page = 1, status }: { page?: number; status?: string }) {
  const currentPage = Math.max(page, 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const where: { status?: PaymentStatus } = {};
  if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
    where.status = status as PaymentStatus;
  }

  const [orders, totalOrders] = await Promise.all([
    prisma.payment.findMany({
      where,
      take: ITEMS_PER_PAGE,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        productType: true,
        amount: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  return {
    orders,
    currentPage,
    totalPages,
  };
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const status = searchParams.status;
  const { orders, currentPage, totalPages } = await getOrders({ page, status });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Order Management</h2>
        <p className="text-muted-foreground">
          View and manage all payment transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            A list of all payment transactions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderControls currentPage={currentPage} totalPages={totalPages} />

          {/* Orders Table */}
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(-8)}...
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users/${order.user.id}`}
                        className="hover:underline"
                      >
                        {order.user.name || order.user.email}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.productType.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(order.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'COMPLETED' ? 'default' :
                          order.status === 'PENDING' ? 'secondary' :
                          order.status === 'REFUNDED' ? 'outline' :
                          'destructive'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
