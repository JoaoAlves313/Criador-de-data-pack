import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
          Criador de Data Pack
        </h1>
        <p className="text-center text-gray-400 mt-2">
          Criado com auxilio de IA por Sussy boy
        </p>
      </div>
    </header>
  );
};

export default Header;