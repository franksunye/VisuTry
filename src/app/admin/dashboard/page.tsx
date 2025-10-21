import React from 'react';
import { prisma } from '@/lib/prisma';

// This is a React Server Component (RSC) to display the admin dashboard.
// It fetches data directly on the server to provide key metrics.

async function getStats() {
  // Fetch key metrics in parallel for efficiency
  const [userCount, orderCount, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'COMPLETED',
      },
    }),
  ]);

  // Format the revenue from cents to a more readable dollar amount
  const revenue = (totalRevenue._sum.amount ?? 0) / 100;

  return {
    userCount,
    orderCount,
    revenue,
  };
}


export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card: Total Users */}
        <div className="bg-white p-4 shadow rounded">
          <h3 className="text-gray-500">Total Users</h3>
          <p className="text-3xl font-bold">{stats.userCount}</p>
        </div>

        {/* Stat Card: Total Orders */}
        <div className="bg-white p-4 shadow rounded">
          <h3 className="text-gray-500">Completed Orders</h3>
          <p className="text-3xl font-bold">{stats.orderCount}</p>
        </div>

        {/* Stat Card: Total Revenue */}
        <div className="bg-white p-4 shadow rounded">
          <h3 className="text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold">${stats.revenue.toFixed(2)}</p>
        </div>

        {/* Placeholder for another stat card */}
        <div className="bg-white p-4 shadow rounded">
          <h3 className="text-gray-500">Pending Tasks</h3>
          <p className="text-3xl font-bold">Coming Soon</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-4 shadow rounded">
        <h3 className="font-bold mb-4">Recent Activity</h3>
        <p className="text-gray-600">
          (A list or chart of recent orders or user sign-ups will be displayed here in a future update.)
        </p>
      </div>
    </div>
  );
}
