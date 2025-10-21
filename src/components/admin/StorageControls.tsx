'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface StorageControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function StorageControls({
  searchTerm,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
}: StorageControlsProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* 搜索框 */}
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          type="text"
          placeholder="Search files..."
          className="w-80"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* 分页控件 */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

