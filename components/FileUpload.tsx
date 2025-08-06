import React, { useState, useCallback } from 'react';
import { CsvFileIcon, UploadIcon } from './Icons';

// PapaParse is loaded from a CDN in index.html, we need to declare it for TypeScript
declare const Papa: any;

interface FileUploadProps {
  onFileLoaded: (results: any, file: File) => void;
  error: string;
  setError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded, error, setError }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileParse = useCallback((file: File) => {
    if (!file) {
      setError("Nenhum arquivo selecionado.");
      return;
    }
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
       setError("Tipo de arquivo inválido. Por favor, envie um arquivo .csv.");
       return;
    }
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        onFileLoaded(results, file);
      },
      error: (err: any, file: File) => {
        console.error("PapaParse error:", err, file);
        setError(`Falha ao analisar ${file.name}: ${err.message}`);
      }
    });
  }, [onFileLoaded, setError]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileParse(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileParse(e.target.files[0]);
    }
  };
  
  const borderColor = isDragging ? 'border-blue-500' : 'border-gray-600';
  const bgColor = isDragging ? 'bg-gray-700/50' : 'bg-gray-800/50';

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 p-8 border-2 ${borderColor} border-dashed rounded-xl transition-colors duration-200 ${bgColor}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-300">
            Arraste e solte seu arquivo CSV aqui
          </p>
          <p className="mt-1 text-sm text-gray-500">ou</p>
          <label htmlFor="file-upload" className="mt-2 inline-block cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Procurar Arquivo
          </label>
        </div>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg text-center">
          {error}
        </div>
      )}
      <div className="mt-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <CsvFileIcon/>
          Formato CSV Esperado
        </h3>
        <p className="mt-2 text-gray-400">
          Seu arquivo CSV deve ter uma linha de cabeçalho. A primeira coluna será tratada como a chave única para cada item e não será editável. As colunas subsequentes são para diferentes localizações.
        </p>
        <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/30 text-blue-200 rounded-lg">
           <p className="font-semibold">Nota Importante:</p>
           <p className="text-sm">Se o arquivo for de clubes, renomeie-o para `clubs.csv`. Se for de jogadores, renomeie-o para `players.csv`.</p>
        </div>
        <pre className="mt-4 p-3 bg-gray-900 rounded-md text-sm text-gray-300 overflow-x-auto">
          <code>
            {`key,english,french,spanish
ITEM_SWORD_NAME,"Sword","Épée","Espada"
ITEM_SWORD_DESC,"A sharp blade.","Une lame tranchante.","Una hoja afilada."`}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default FileUpload;