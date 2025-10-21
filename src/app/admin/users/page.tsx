import { prisma } from '@/lib/prisma';
import React from 'react';

// This is a React Server Component (RSC) to display the user management page.
// It fetches a paginated list of users from the database.

interface UsersPageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

const ITEMS_PER_PAGE = 10;

async function getUsers({ page = 1, search = '' }: { page?: number; search?: string }) {
  const currentPage = Math.max(page, 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      take: ITEMS_PER_PAGE,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  return {
    users,
    currentPage,
    totalPages,
  };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.search ?? '';
  const { users, currentPage, totalPages } = await getUsers({ page, search });

  return (
    <div className="bg-white p-6 shadow rounded">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>

      {/* Search and filter controls will go here */}
      <div className="mb-4">
        <p>Search and filter controls will be implemented here.</p>
      </div>

      {/* Users Table */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.createdAt.toLocaleDateString()}</td>
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
