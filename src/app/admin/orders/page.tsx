import { prisma } from '@/lib/prisma';
import React from 'react';

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

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const [orders, totalOrders] = await Promise.all([
    prisma.payment.findMany({
      where,
      take: ITEMS_PER_PAGE,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true, // Include user data for display
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
    <div className="bg-white p-6 shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Order Management</h2>

      {/* Filter controls will go here */}
      <div className="mb-4">
        <p>Filter controls will be implemented here.</p>
      </div>

      {/* Orders Table */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
              <td className="px-6 py-4 whitespace-nowrap">{order.user.name} ({order.user.email})</td>
              <td className="px-6 py-4 whitespace-nowrap">${(order.amount / 100).toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{order.createdAt.toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls will go here */}
      <div className="mt-4">
        <p>Pagination controls will be implemented here. Current Page: {currentPage} of {totalPages}</p>
      </div>
    </div>
  );
}
