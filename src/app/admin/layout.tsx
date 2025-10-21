import React from 'react';
import Link from 'next/link';
import { UserProfile } from '@/components/auth/UserProfile';

// This is the root layout for the /admin section.
// It provides a consistent sidebar navigation and header for all admin pages.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 text-white flex-shrink-0">
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          VisuTry Admin
        </div>
        <nav className="mt-4">
          <ul>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link href="/admin/dashboard">Dashboard</Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link href="/admin/users">Users</Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link href="/admin/orders">Orders</Link>
            </li>
            {/* Add more links as new admin sections are created */}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <div>
            <UserProfile />
          </div>
        </header>
        <main className="p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
