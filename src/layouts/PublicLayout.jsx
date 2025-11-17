import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-green-100 to-green-50 text-gray-800">
      
      {/* ENCABEZADO */}
      <header className="w-full border-b border-green-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8 6 4 8 2 11c2 1 3 4 3 6a6 6 0 0012 0c0-2 1-5 3-6-2-3-6-5-8-9z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="font-semibold text-xl text-green-800">ZeroWaste Exchange</span>
          </Link>

          <nav className="hidden sm:flex gap-4 items-center">
            <Link to="/explore" className="px-3 py-2 rounded-md text-green-800 hover:bg-green-100">
              Explorar
            </Link>
            <Link to="/register" className="px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
              Registrarse
            </Link>
            <Link to="/login" className="px-3 py-2 rounded-md border border-green-200 text-green-800 hover:bg-green-50">
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          <Outlet />
        </div>
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="w-full border-t border-green-200">
        <div className="px-6 py-6 text-sm text-green-700 flex flex-col sm:flex-row justify-between">
          <div>Proyecto de responsabilidad social — Zero Waste Exchange</div>
          <div className="mt-2 sm:mt-0">All rights reserved</div>
        </div>
      </footer>

    </div>
  );
}
