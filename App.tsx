import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CsvRow } from './types';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import Pagination from './components/Pagination';
import { DownloadIcon, SearchIcon, ClearIcon } from './components/Icons';

// PapaParse is loaded from a CDN in index.html, we need to declare it for TypeScript
declare const Papa: any;

const DEFAULT_ROWS_PER_PAGE = 50;

const App: React.FC = () => {
  const [data, setData] = useState<CsvRow[]>([]);
  const [viewData, setViewData] = useState<CsvRow[]>([]); // Data currently displayed in the table
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Search and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const handleFileLoaded = useCallback((results: any, file: File) => {
    if (results.errors.length > 0) {
      console.error("Parsing errors:", results.errors);
      setError(`Erro ao analisar o CSV: ${results.errors[0].message}. Por favor, verifique o formato do arquivo.`);
      return;
    }

    const nonEmptyData = results.data.filter((row: CsvRow) => 
      results.meta.fields.some((field: string) => row[field] && String(row[field]).trim() !== '')
    );

    if (nonEmptyData.length === 0) {
      setError("O arquivo CSV está vazio ou não pôde ser analisado corretamente.");
      return;
    }

    setError('');
    setFileName(file.name);
    setHeaders(results.meta.fields || []);
    setData(nonEmptyData as CsvRow[]);
    setViewData(nonEmptyData as CsvRow[]);
    setCurrentPage(1);
    setSearchTerm('');
    setActiveSearchTerm('');
  }, []);

  const handleReset = useCallback(() => {
    setData([]);
    setViewData([]);
    setHeaders([]);
    setFileName('');
    setError('');
    setCurrentPage(1);
    setRowsPerPage(DEFAULT_ROWS_PER_PAGE);
    setSearchTerm('');
    setActiveSearchTerm('');
  }, []);

  const handleDataChange = useCallback((rowToUpdate: CsvRow, columnId: string, value: string) => {
    const keyColumn = headers[0];
    if (!keyColumn) return;

    const updateRow = (row: CsvRow) => {
        if (row[keyColumn] === rowToUpdate[keyColumn]) {
            return { ...row, [columnId]: value };
        }
        return row;
    };
    
    // Update master data
    setData(oldData => oldData.map(updateRow));
    
    // Update view data to prevent disappearing row
    setViewData(oldViewData => oldViewData.map(updateRow));
  }, [headers]);

  const handleDownload = useCallback(() => {
    if (data.length === 0) return;

    const csvString = Papa.unparse(data, {
      columns: headers,
      header: true,
    });

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const newFileName = fileName.replace('.csv', `_localized.csv`);
    link.setAttribute('download', newFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, headers, fileName]);
  
  const handleClearSearch = useCallback(() => {
    setActiveSearchTerm('');
    setSearchTerm('');
    setViewData(data);
    setCurrentPage(1);
  }, [data]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
        handleClearSearch();
        return;
    }
    
    const lowercasedFilter = searchTerm.toLowerCase();
    const results = data.filter(row =>
      headers.some(header =>
        String(row[header] || '').toLowerCase().includes(lowercasedFilter)
      )
    );
    
    setActiveSearchTerm(searchTerm);
    setViewData(results);
    setCurrentPage(1);
  }, [searchTerm, data, headers, handleClearSearch]);


  const handleRowsPerPageChange = useCallback((size: number) => {
      setRowsPerPage(size);
      setCurrentPage(1);
  }, []);

  // Memoize paginated data calculation
  const { paginatedData, totalPages, startIndex } = useMemo(() => {
    const totalRows = viewData.length;
    const calculatedTotalPages = Math.ceil(totalRows / rowsPerPage) || 1;
    const safeCurrentPage = Math.max(1, Math.min(currentPage, calculatedTotalPages));
    
    const newStartIndex = (safeCurrentPage - 1) * rowsPerPage;
    const newPaginatedData = viewData.slice(newStartIndex, newStartIndex + rowsPerPage);
    return { paginatedData: newPaginatedData, totalPages: calculatedTotalPages, startIndex: newStartIndex };
  }, [viewData, currentPage, rowsPerPage]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-200">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {data.length === 0 ? (
            <FileUpload onFileLoaded={handleFileLoaded} error={error} setError={setError} />
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Editando: {fileName}</h2>
                  <p className="text-sm text-gray-400">A primeira coluna é a chave e não pode ser editada.</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    Começar de Novo
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
                  >
                    <DownloadIcon />
                    Baixar CSV
                  </button>
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2 mb-6">
                <div className="relative flex-grow w-full sm:max-w-md">
                    <input
                        type="search"
                        placeholder="Pesquisar em todas as colunas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full block pl-4 pr-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        aria-label="Pesquisar dados da tabela"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        <SearchIcon className="h-5 w-5" />
                        Pesquisar
                    </button>
                    {activeSearchTerm && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200"
                            aria-label="Limpar pesquisa"
                        >
                            <ClearIcon className="h-5 w-5" />
                            Limpar
                        </button>
                    )}
                </div>
              </form>

              <div className="border border-gray-700 rounded-lg shadow-lg bg-gray-800 overflow-hidden">
                  <DataTable
                    headers={headers}
                    data={paginatedData}
                    onDataChange={handleDataChange}
                  />
                  {totalPages > 1 && (
                      <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          rowsPerPage={rowsPerPage}
                          onRowsPerPageChange={handleRowsPerPageChange}
                          totalRows={viewData.length}
                          startIndex={startIndex}
                      />
                  )}
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="w-full py-4">
        <div className="text-center text-sm text-gray-500">
          <p>Criador de data pack</p>
        </div>
      </footer>
    </div>
  );
};

export default App;