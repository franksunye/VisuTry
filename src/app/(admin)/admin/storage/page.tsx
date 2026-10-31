import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StorageManager from '@/components/admin/StorageManager';

// Storage 管理页面
export default async function StoragePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Storage Management</h2>
        <p className="text-muted-foreground">
          Inspect Public and Private Vercel Blob files. Lifecycle cleanup runs separately.
        </p>
      </div>

      <StorageManager />
    </div>
  );
}

