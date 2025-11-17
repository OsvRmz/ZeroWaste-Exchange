// src/layouts/PrivateLayout.jsx
import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getMe, logout } from '../api'; // import desde src/api/index.js

export default function PrivateLayout() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener perfil al montar
  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      try {
        const me = await getMe();
        if (!mounted) return;
        setUser(me);
      } catch (err) {
        navigate('/login', { replace: true, state: { from: location.pathname } });
      } finally {
        if (mounted) setLoadingUser(false);
      }
    }
    fetchUser();
    return () => { mounted = false; };
  }, [navigate, location.pathname]);

  // Atajo / para enfocar búsqueda
  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Navegar al enviar búsqueda
  function onSearchSubmit(e) {
    e?.preventDefault();
    const q = search.trim();
    navigate(`/explore${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setOpenMobileMenu(false);
  }

  async function handleLogout() {
    try {
      logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  // Avatar fallback
  function Avatar({ user }) {
    if (!user) return <div className="w-9 h-9 rounded-full bg-green-200" />;
    if (user.photo) {
      return <img src={user.photo} alt={user.name} className="w-9 h-9 rounded-full object-cover" />;
    }
    const initials = user.name ? user.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() : 'U';
    return (
      <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center font-medium">
        {initials}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-green-100 to-green-50 text-gray-800">
      {/* Top nav */}
      <header className="w-full border-b border-green-200 bg-white/60 backdrop-blur-sm">
        <div className="px-6 py-3 flex items-center justify-between max-w-full">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              className="sm:hidden p-2 rounded-md hover:bg-green-50"
              aria-label="Abrir menú"
              onClick={() => setOpenMobileMenu(v => !v)}
            >
              <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link to="/explore" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8 6 4 8 2 11c2 1 3 4 3 6a6 6 0 0012 0c0-2 1-5 3-6-2-3-6-5-8-9z" fill="currentColor" />
                </svg>
              </div>
              <span className="font-semibold text-lg text-green-800">ZeroWaste</span>
            </Link>
          </div>

          {/* Search */}
          <form onSubmit={onSearchSubmit} className="flex-1 max-w-lg mx-4 hidden sm:flex items-center">
            <label htmlFor="global-search" className="sr-only">Buscar artículos</label>
            <input
              id="global-search"
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título..."
              className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <button type="submit" className="px-3 py-2 m-1 rounded-r-md bg-green-600 text-white hover:bg-green-700">Buscar</button>
          </form>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4">
            <NavLink to="/explore" className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-green-100 text-green-800' : 'text-green-700 hover:bg-green-50'}`}>Explorar</NavLink>
            <NavLink to="/items/create" className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-green-100 text-green-800' : 'text-green-700 hover:bg-green-50'}`}>Crear publicación</NavLink>
            <NavLink to="/dashboard" className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-green-100 text-green-800' : 'text-green-700 hover:bg-green-50'}`}>Dashboard</NavLink>
            <NavLink to="/metrics" className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-green-100 text-green-800' : 'text-green-700 hover:bg-green-50'}`}>Impacto Global</NavLink>

            {/* User avatar + dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenUserMenu(v => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-green-50 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={openUserMenu}
              >
                <Avatar user={user} />
                <span className="text-sm text-green-700 hidden md:inline-block">{loadingUser ? 'Cargando...' : user?.name || 'Usuario'}</span>
              </button>

              {openUserMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border border-green-100 z-20">
                  <Link to="/profile/edit" className="block px-4 py-2 text-sm text-green-700 hover:bg-green-50" onClick={() => setOpenUserMenu(false)}>Editar perfil</Link>
                  <Link to="/about" className="block px-4 py-2 text-sm text-green-700 hover:bg-green-50" onClick={() => setOpenUserMenu(false)}>Acerca del proyecto</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Cerrar sesión</button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Mobile menu */}
        {openMobileMenu && (
          <div className="sm:hidden px-4 pb-4">
            <form onSubmit={onSearchSubmit} className="flex items-center gap-2 mb-3">
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por título..."
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white">Ir</button>
            </form>

            <div className="flex flex-col gap-1">
              <NavLink to="/explore" className="px-3 py-2 rounded-md text-green-700 hover:bg-green-50" onClick={() => setOpenMobileMenu(false)}>Explorar</NavLink>
              <NavLink to="/items/create" className="px-3 py-2 rounded-md text-green-700 hover:bg-green-50" onClick={() => setOpenMobileMenu(false)}>Crear publicación</NavLink>
              <NavLink to="/dashboard" className="px-3 py-2 rounded-md text-green-700 hover:bg-green-50" onClick={() => setOpenMobileMenu(false)}>Dashboard</NavLink>
              <NavLink to="/favorites" className="px-3 py-2 rounded-md text-green-700 hover:bg-green-50" onClick={() => setOpenMobileMenu(false)}>Favoritos</NavLink>
              <Link to="/profile/edit" className="px-3 py-2 rounded-md text-green-700 hover:bg-green-50" onClick={() => setOpenMobileMenu(false)}>Editar perfil</Link>
              <Link to="/metrics" className="px-3 py-2 rounded-md text-green-700 hover:bg-green-50" onClick={() => setOpenMobileMenu(false)}>Impacto ambiental</Link>
              <Link to="/about" className="px-3 py-2 rounded-md text-green-700 hover:bg-green-50" onClick={() => setOpenMobileMenu(false)}>Acerca del proyecto</Link>
              <button onClick={handleLogout} className="mt-2 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 text-left">Cerrar sesión</button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-stretch">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-64 border-r border-green-100 bg-white/40 p-4">
          <div className="text-sm text-green-800 font-medium mb-4">Acciones rápidas</div>
          <nav className="flex flex-col gap-2">
            <NavLink to="/items/create" className="px-3 py-2 rounded hover:bg-green-50 text-green-700">Crear publicación</NavLink>
            <div className="border-t border-green-100 mt-3 pt-3 text-sm text-green-700">Explorar rápido</div>
            <NavLink to="/explore?transactionType=donación" className="px-3 py-2 rounded hover:bg-green-50 text-green-700">Donaciones</NavLink>
            <NavLink to="/explore?transactionType=intercambio" className="px-3 py-2 rounded hover:bg-green-50 text-green-700">Intercambios</NavLink>
            <NavLink to="/explore?transactionType=venta" className="px-3 py-2 rounded hover:bg-green-50 text-green-700">Ventas</NavLink>
            <div className="border-t border-green-100 mt-3 pt-3 text-sm text-green-700">Categorías rápidas</div>
            <NavLink to="/explore?category=Ropa" className="px-3 py-2 rounded hover:bg-green-50 text-green-700">Ropa</NavLink>
            <NavLink to="/explore?category=Electrónica" className="px-3 py-2 rounded hover:bg-green-50 text-green-700">Electrónica</NavLink>
            <NavLink to="/explore?category=Libros" className="px-3 py-2 rounded hover:bg-green-50 text-green-700">Libros</NavLink>
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-green-200 bg-white/60">
        <div className="px-6 py-4 text-sm text-green-700 flex flex-col sm:flex-row justify-between items-center">
          <div>ZeroWaste Exchange — Proyecto escolar</div>
          <div className="mt-2 sm:mt-0 flex gap-4">
            <Link to="/metrics" className="text-green-600 hover:underline">Impacto ambiental</Link>
            <Link to="/about" className="text-green-600 hover:underline">Acerca del proyecto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
