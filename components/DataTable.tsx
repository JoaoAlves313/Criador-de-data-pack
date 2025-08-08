import React, { memo } from 'react';
import { CsvRow } from '../types';

interface DataTableProps {
  headers: string[];
  data: CsvRow[];
  onDataChange: (row: CsvRow, columnId: string, value: string) => void;
  noResultsMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({ headers, data, onDataChange, noResultsMessage }) => {
  if (headers.length === 0) {
    return <p className="text-center text-gray-400 p-8">Nenhum dado para exibir.</p>;
  }
  
  if (data.length === 0) {
    return <p className="text-center text-gray-400 p-8">{noResultsMessage || 'Nenhum resultado encontrado.'}</p>;
  }

  const keyColumn = headers[0];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-700/50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-gray-800">
          {data.map((row, index) => (
            <tr key={row[keyColumn] || index} className="hover:bg-gray-700/50 transition-colors duration-150">
              {headers.map((header, colIndex) => (
                <td key={header} className="px-6 py-4 whitespace-nowrap">
                  {colIndex === 0 ? (
                    <span className="text-sm font-medium text-gray-300">
                      {row[header]}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={row[header] || ''}
                      onChange={(e) => onDataChange(row, header, e.target.value)}
                      className="w-full bg-gray-900/50 text-gray-200 border border-gray-600 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(DataTable);