'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { PaymentStatus } from '@prisma/client';

export default function OrderControls({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1'); // Reset to first page on new filter
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 0 && page <= totalPages) {
      params.set('page', String(page));
      replace(`${pathname}?${params.toString()}`);
    }
  };

  const statuses = Object.values(PaymentStatus);

  return (
    <div className="flex justify-between items-center mb-4">
      {/* Status Filter */}
      <div>
        <select
          className="px-4 py-2 border rounded-md"
          onChange={(e) => handleStatusChange(e.target.value)}
          defaultValue={searchParams.get('status')?.toString() ?? ''}
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
