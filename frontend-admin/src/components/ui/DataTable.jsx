import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortingRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react';
import AppButton from './AppButton';

const SkeletonRows = ({ columns, rows = 5 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50">
        {columns.map((col, j) => (
          <td key={j} className="px-5 py-3.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

const MobileCardView = ({ table, columns, onRowClick }) =>
  table.getRowModel().rows.map((row) => (
    <div
      key={row.id}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={`border-b border-gray-100 p-4 last:border-b-0 dark:border-gray-800 ${
        onRowClick ? 'cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/40' : ''
      }`}
    >
      {row.getVisibleCells().map((cell) => (
        <div key={cell.id} className="flex items-baseline justify-between py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            {typeof cell.column.columnDef.header === 'string'
              ? cell.column.columnDef.header
              : cell.column.id}
          </span>
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </span>
        </div>
      ))}
    </div>
  ));

const DataTable = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  emptyIcon: EmptyIcon,
  pagination,
  onPageChange,
  onRowClick,
  globalFilter,
  onGlobalFilterChange,
}) => {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getSortingRowModel: getSortingRowModel(),
    manualPagination: true,
  });

  const isEmpty = !loading && (!data || data.length === 0);

  return (
    <div>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-100 dark:border-gray-800">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={`px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 ${
                          canSort ? 'cursor-pointer select-none' : ''
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && !sorted && (
                            <ChevronsUpDown size={12} className="text-gray-300 dark:text-gray-600" />
                          )}
                          {sorted === 'asc' && <ChevronUp size={12} className="text-emerald-500" />}
                          {sorted === 'desc' && <ChevronDown size={12} className="text-emerald-500" />}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {loading ? (
              <SkeletonRows columns={columns} />
            ) : isEmpty ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    {EmptyIcon && (
                      <EmptyIcon
                        size={40}
                        strokeWidth={1.2}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                    )}
                    <p className="text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={`border-b border-gray-50 hover:bg-gray-50/80 dark:border-gray-800/50 dark:hover:bg-gray-800/30 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      <div className="md:hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : isEmpty ? (
          <div className="py-16 text-center">
            {EmptyIcon && (
              <EmptyIcon
                size={40}
                strokeWidth={1.2}
                className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
              />
            )}
            <p className="text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <MobileCardView table={table} columns={columns} onRowClick={onRowClick} />
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages}
            {pagination.totalRecords != null && (
              <span className="ml-1">({pagination.totalRecords} total)</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <AppButton
              variant="secondary"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="text-xs"
            >
              Prev
            </AppButton>
            <AppButton
              variant="secondary"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="text-xs"
            >
              Next
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
