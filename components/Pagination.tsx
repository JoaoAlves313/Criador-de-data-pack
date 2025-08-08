import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (size: number) => void;
  totalRows: number;
  startIndex: number;
}

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200];

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  totalRows,
  startIndex
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleRowsPerPageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRowsPerPageChange(Number(e.target.value));
  };

  const startRow = totalRows > 0 ? Math.min(startIndex + 1, totalRows) : 0;
  const endRow = Math.min(startIndex + rowsPerPage, totalRows);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap mb-4 sm:mb-0">
         <div className="flex items-center gap-2">
            <label htmlFor="rows-per-page" className="text-sm text-gray-400">Linhas por página:</label>
            <select
                id="rows-per-page"
                value={rowsPerPage}
                onChange={handleRowsPerPageSelect}
                className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Linhas por página"
            >
                {ROWS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
         </div>
        <p className="text-sm text-gray-400">
          Mostrando <span className="font-medium text-white">{startRow}</span>-<span className="font-medium text-white">{endRow}</span> de <span className="font-medium text-white">{totalRows}</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-sm text-gray-400">
          Página <span className="font-medium text-white">{currentPage}</span> de <span className="font-medium text-white">{totalPages}</span>
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Próxima página"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;