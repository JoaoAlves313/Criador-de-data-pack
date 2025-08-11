
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CsvRow } from './types';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import Pagination from './components/Pagination';
import TeamFilterModal from './components/TeamFilterModal';
import { DownloadIcon, SearchIcon, ClearIcon, FilterIcon, StarIcon } from './components/Icons';
import { TEAMS } from './data/teams';

// PapaParse is loaded from a CDN in index.html, we need to declare it for TypeScript
declare const Papa: any;

const DEFAULT_ROWS_PER_PAGE = 50;

const App: React.FC = () => {
  const [data, setData] = useState<CsvRow[]>([]);
  const [filteredData, setFilteredData] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Search, Filter, and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [activeTeamFilter, setActiveTeamFilter] = useState<string | null>(null);
  const [isTeamFilterModalOpen, setIsTeamFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  // Derive data structures from the centralized TEAMS constant for use in the app
  const TEAM_NAMES = useMemo(() => Object.fromEntries(TEAMS.map(team => [team.key, team.name])), []);
  const TEAM_IDS = useMemo(() => Object.fromEntries(TEAMS.map(team => [team.key, team.ids])), []);

  const runFilters = useCallback((sourceData: CsvRow[], termToApply: string, teamToApply: string | null) => {
    let results = sourceData;

    // Apply team filter
    if (teamToApply && TEAM_IDS[teamToApply]) {
        const teamIds = new Set(TEAM_IDS[teamToApply]);
        const keyColumn = headers[0];
        if (keyColumn) {
            results = results.filter(row => teamIds.has(String(row[keyColumn])));
        }
    }
    
    // Apply search term filter
    const lowercasedSearchTerm = termToApply.trim().toLowerCase();
    if (lowercasedSearchTerm) {
        results = results.filter(row => 
            Object.values(row).some(value => 
                String(value).toLowerCase().includes(lowercasedSearchTerm)
            )
        );
    }
    
    setFilteredData(results);
    setCurrentPage(1);
  }, [headers, TEAM_IDS]);

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
    setFilteredData(nonEmptyData as CsvRow[]);
    setCurrentPage(1);
    setSearchTerm('');
    setActiveSearchTerm('');
    setActiveTeamFilter(null);
  }, []);

  const handleReset = useCallback(() => {
    setData([]);
    setFilteredData([]);
    setHeaders([]);
    setFileName('');
    setError('');
    setCurrentPage(1);
    setRowsPerPage(DEFAULT_ROWS_PER_PAGE);
    setSearchTerm('');
    setActiveSearchTerm('');
    setActiveTeamFilter(null);
    setIsTeamFilterModalOpen(false);
  }, []);

  const handleDataChange = useCallback((rowToUpdate: CsvRow, columnId: string, value: string) => {
    const keyColumn = headers[0];
    if (!keyColumn) return;
    
    const updateRow = (row: CsvRow): CsvRow => {
        if (row[keyColumn] === rowToUpdate[keyColumn]) {
            return { ...row, [columnId]: value };
        }
        return row;
    };

    setData(prevData => prevData.map(updateRow));
    setFilteredData(prevFilteredData => prevFilteredData.map(updateRow));
  }, [headers]);

  const handleDownload = useCallback(() => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const downloadFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    link.setAttribute('download', downloadFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, fileName]);

  const handleAddLegends = useCallback(() => {
    if (headers.length < 2) {
        setError("Para adicionar lendas, o CSV carregado deve ter pelo menos duas colunas (chave e nome).");
        return;
    }

    const legendsCsv = `890400020,Adam Kamiński
890400012,Airton Junior
890400018,Andrea Crimi
890400014,Angel Medina
890400005,Brian de Wit
890400025,Chipi Guzmán
890400017,Diego Cardenas
890400016,George Willems
890400048,Gianluca Gori
890400036,H. Ayala
890400015,I. Narimán
890400049,J. L. González
890400044,Jean Battiston
890400013,Julian Barreto
890400030,Ken Hughes
890400038,Klotër Zhelino
890400008,Ko Sun-hyuk
890400026,Lázaro
890400031,M. Panjiatani
890400027,Marcus Jagger
890400012,Max Mineiro
890400046,N. Ganjavi
890400006,Neil Morris
890400041,Nkembi
890400043,Paco Yupanqui
890400028,R. Chavo Pietro
890400024,R. Skonderović
890400023,Raj Ramunajan
890400042,Rivaldo
890400029,S. McHennicks
890400019,Saladin
890400022,Sam Alonso
890400050,Sam Häyhänen
890400011,Uwe Zieler
890400045,V. Bakambi
890400034,Victor Robles
890400032,W. Poireaux
890400039,Xao Shuan
890400040,Yuri Çalışkan
890400004,Zé Rato
890400021,Zuca Tigrão`;

    const lines = legendsCsv.split('\n').filter(line => line.trim() !== '');
    const keyColumn = headers[0];
    const nameColumn = headers[1];

    const newRows: CsvRow[] = lines.map(line => {
        const parts = line.split(',');
        const id = parts[0];
        const name = parts.slice(1).join(',');
        const newRow: CsvRow = {
            [keyColumn]: id,
            [nameColumn]: name,
        };
        for (let i = 2; i < headers.length; i++) {
            newRow[headers[i]] = '';
        }
        return newRow;
    });

    const existingKeys = new Set(data.map(row => row[keyColumn]));
    const uniqueNewRows = newRows.filter(row => !existingKeys.has(row[keyColumn]));

    if (uniqueNewRows.length === 0) {
        console.log("Todas as lendas já existem nos dados.");
        return;
    }

    const newData = [...data, ...uniqueNewRows];
    setData(newData);
    runFilters(newData, activeSearchTerm, activeTeamFilter);
  }, [data, headers, runFilters, activeSearchTerm, activeTeamFilter]);
  
  const triggerSearch = useCallback(() => {
    const termToApply = searchTerm.trim();
    setActiveSearchTerm(termToApply);
    runFilters(data, termToApply, activeTeamFilter);
  }, [searchTerm, data, activeTeamFilter, runFilters]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    runFilters(data, '', activeTeamFilter);
  };
  
  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = useMemo(() => 
    filteredData.slice(startIndex, startIndex + rowsPerPage), 
    [filteredData, startIndex, rowsPerPage]
  );
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSelectTeam = (teamKey: string) => {
    setActiveTeamFilter(teamKey);
    setIsTeamFilterModalOpen(false);
    runFilters(data, activeSearchTerm, teamKey);
  };

  const handleClearTeamFilter = () => {
    setActiveTeamFilter(null);
    setIsTeamFilterModalOpen(false);
    runFilters(data, activeSearchTerm, null);
  };

  const handleClearTeamFilterFromBadge = () => {
    setActiveTeamFilter(null);
    runFilters(data, activeSearchTerm, null);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 antialiased flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {data.length === 0 ? (
          <FileUpload onFileLoaded={handleFileLoaded} error={error} setError={setError} />
        ) : (
          <div className="flex-grow flex flex-col bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-grow w-full sm:w-auto">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Pesquisar em todos os campos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="w-full pl-10 pr-10 py-2 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {searchTerm && (
                            <button onClick={handleClearSearch} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white" title="Limpar pesquisa">
                                <ClearIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={triggerSearch}
                    className="flex-grow sm:flex-grow-0 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    title="Pesquisar"
                  >
                    <SearchIcon className="h-5 w-5" />
                    Pesquisar
                  </button>
                  <button
                    onClick={() => setIsTeamFilterModalOpen(true)}
                    className="flex-grow sm:flex-grow-0 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <FilterIcon className="h-5 w-5" />
                    Filtrar
                  </button>
                  <button
                    onClick={handleAddLegends}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <StarIcon className="h-5 w-5" />
                    Adicionar Lendas
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DownloadIcon />
                    Salvar CSV
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {activeTeamFilter && (
                    <span className="inline-flex items-center gap-x-2 bg-blue-900/50 text-blue-300 text-sm font-medium px-3 py-1 rounded-full">
                      Filtro ativo: {TEAM_NAMES[activeTeamFilter]}
                      <button onClick={handleClearTeamFilterFromBadge} className="ml-1 text-blue-300 hover:text-white" title="Limpar filtro de time">
                          <ClearIcon className="h-4 w-4" />
                      </button>
                    </span>
                )}
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto">
               <DataTable 
                  headers={headers} 
                  data={paginatedData} 
                  onDataChange={handleDataChange}
                  noResultsMessage={activeSearchTerm || activeTeamFilter ? 'Nenhum resultado corresponde aos seus filtros.' : 'Nenhum dado para exibir.'} 
               />
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(size) => { setRowsPerPage(size); setCurrentPage(1); }}
              totalRows={totalRows}
              startIndex={startIndex}
            />
          </div>
        )}
      </main>
      <TeamFilterModal 
        isOpen={isTeamFilterModalOpen}
        onClose={() => setIsTeamFilterModalOpen(false)}
        onSelectTeam={handleSelectTeam}
        onClearFilter={handleClearTeamFilter}
        activeFilter={activeTeamFilter}
        teams={TEAM_NAMES}
      />
    </div>
  );
};

export default App;
