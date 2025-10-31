import { prisma } from '@/lib/prisma';
import React from 'react';
import UserControls from '@/components/admin/UserControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { User } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Manage and view all registered users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users registered in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserControls currentPage={currentPage} totalPages={totalPages} />

          {/* Users Table */}
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                      {user.name || 'N/A'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isPremium ? 'default' : 'outline'}>
                        {user.isPremium ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
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
