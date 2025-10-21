import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

async function getOrderDetails(orderId: string) {
  const order = await prisma.payment.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  return order;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const order = await getOrderDetails(params.id);

  if (!order) {
    notFound();
  }

  // Construct Stripe Dashboard URL
  const stripePaymentUrl = order.stripePaymentId 
    ? `https://dashboard.stripe.com/payments/${order.stripePaymentId}`
    : order.stripeSessionId
    ? `https://dashboard.stripe.com/checkout/sessions/${order.stripeSessionId}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Details</h2>
          <p className="text-muted-foreground">
            Order ID: {order.id}
          </p>
        </div>
        <Link href="/admin/orders">
          <button className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
            ← Back to Orders
          </button>
        </Link>
      </div>

      {/* Order Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Badge
              variant={
                order.status === 'COMPLETED' ? 'default' :
                order.status === 'PENDING' ? 'secondary' :
                order.status === 'REFUNDED' ? 'outline' :
                'destructive'
              }
              className="text-lg px-4 py-2"
            >
              {order.status}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(order.updatedAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Information */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <Link 
                href={`/admin/users/${order.user.id}`}
                className="text-sm hover:underline text-blue-600"
              >
                {order.user.name || 'N/A'}
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{order.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User ID</p>
              <p className="text-sm font-mono">{order.user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer Since</p>
              <p className="text-sm">{new Date(order.user.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">${(order.amount / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Currency</p>
              <p className="text-sm uppercase">{order.currency}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
              <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
              <p className="text-sm">Stripe Checkout</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product Type</p>
              <p className="text-sm font-semibold">
                {order.productType.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{order.description || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Payment Details</CardTitle>
          <CardDescription>
            View detailed payment information in Stripe Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Stripe Session ID</p>
            <p className="text-sm font-mono break-all">{order.stripeSessionId}</p>
          </div>
          {order.stripePaymentId && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Stripe Payment ID</p>
              <p className="text-sm font-mono break-all">{order.stripePaymentId}</p>
            </div>
          )}
          {stripePaymentUrl && (
            <div className="pt-4">
              <a
                href={stripePaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View in Stripe Dashboard
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Order Created</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {order.status === 'COMPLETED' && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Payment Completed</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            {order.status === 'REFUNDED' && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-yellow-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Payment Refunded</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            {order.status === 'FAILED' && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-red-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Payment Failed</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

