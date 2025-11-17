import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getItems, toggleFavorite } from '../api';
import { getMyFavorites } from '../api';

function Price({ price, transactionType }) {
  if (transactionType !== 'venta') return <span className="text-sm text-green-700/80">Gratis / Donación</span>;
  return <span className="text-sm font-medium text-green-800">${Number(price).toFixed(2)}</span>;
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query params state (kept in URL)
  const q = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const transactionTypeParam = searchParams.get('transactionType') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = Number(searchParams.get('page') || 1);
  const limitParam = Number(searchParams.get('limit') || 12);

  // Local UI state
  const [queryText, setQueryText] = useState(q);
  const [category, setCategory] = useState(categoryParam);
  const [transactionType, setTransactionType] = useState(transactionTypeParam);
  const [sort, setSort] = useState(sortParam);
  const [page, setPage] = useState(pageParam);
  const [limit, setLimit] = useState(limitParam);

  const [itemsData, setItemsData] = useState({ items: [], total: 0, page: 1, limit });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Favorites set (ids) to mark UI; initial from server
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loadingFav, setLoadingFav] = useState(false);

  // Derived categories from loaded items (helps populate filter list)
  const categories = useMemo(() => {
    const s = new Set(itemsData.items.map(it => it.category).filter(Boolean));
    return Array.from(s);
  }, [itemsData.items]);

  // Keep URL params in sync when local state changes
  useEffect(() => {
    const params = {};
    if (queryText) params.q = queryText;
    if (category) params.category = category;
    if (transactionType) params.transactionType = transactionType;
    if (sort && sort !== 'newest') params.sort = sort;
    if (page && page > 1) params.page = page;
    if (limit && limit !== 12) params.limit = limit;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryText, category, transactionType, sort, page, limit]);

  // Fetch items whenever search params (the ones in URL) change
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getItems({ q: queryText, category, transactionType, sort, page, limit });
        if (!mounted) return;
        setItemsData({ items: res.items || [], total: res.total || 0, page: res.page || 1, limit: res.limit || limit });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Error cargando artículos');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [queryText, category, transactionType, sort, page, limit]);

  // Load favorites (if logged) to mark UI
  useEffect(() => {
    let mounted = true;
    async function loadFavs() {
      setLoadingFav(true);
      try {
        const favs = await getMyFavorites();
        if (!mounted) return;
        const ids = new Set((favs || []).map(i => String(i._id || i.id)));
        setFavoriteIds(ids);
      } catch (err) {
        // si no está logueado, getMyFavorites lanzará error -> no hacemos nada (no mostrar botón activo)
        setFavoriteIds(new Set());
      } finally {
        if (mounted) setLoadingFav(false);
      }
    }
    loadFavs();
    return () => { mounted = false; };
  }, []); // ejecutar solo al montar

  // Toggle favorito (optimista en UI)
  async function handleToggleFavorite(itemId) {
    try {
      // Optimistic UI change
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (next.has(String(itemId))) next.delete(String(itemId));
        else next.add(String(itemId));
        return next;
      });

      const res = await toggleFavorite(itemId);
      // backend returns the populated favorites array (per implementation); convert to set
      if (Array.isArray(res)) {
        const ids = new Set(res.map(it => String(it._id || it.id)));
        setFavoriteIds(ids);
      } else {
        // fallback: do nothing (we already toggled optimistically)
      }
    } catch (err) {
      // revert optimistic change on error and redirect to login if unauthorized
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (next.has(String(itemId))) next.delete(String(itemId));
        else next.add(String(itemId));
        return next;
      });
      if (err.status === 401) {
        navigate('/login');
      } else {
        setError(err.message || 'Error al actualizar favoritos');
      }
    }
  }

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil((itemsData.total || 0) / limit));

  function gotoPage(p) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-green-800">Explorar artículos</h2>
        <p className="text-sm text-green-700/80">Busca, filtra y encuentra objetos para donar, intercambiar o comprar a precio moderado.</p>
      </div>

      {/* Controles: búsqueda + filtros */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <form
          onSubmit={e => { e.preventDefault(); setPage(1); }}
          className="flex flex-wrap gap-3 items-center"
        >
          {/* Buscador */}
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <input
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              placeholder="Buscar por título..."
              className="flex-1 min-w-[180px] px-3 py-2 border rounded-md"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 whitespace-nowrap"
            >
              Buscar
            </button>
          </div>


          {/* Selects */}
          <div className="flex flex-wrap gap-3">
            <select
              className="px-3 py-2 border rounded"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
            >
              <option value="">Todas las categorías</option>
              {['Ropa', 'Electrónica', 'Libros', 'Mueble', 'Otros'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              {categories
                .filter(c => !['Ropa', 'Electrónica', 'Libros', 'Mueble', 'Otros'].includes(c))
                .map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
            </select>

            <select
              className="px-3 py-2 border rounded"
              value={transactionType}
              onChange={e => { setTransactionType(e.target.value); setPage(1); }}
            >
              <option value="">Cualquier transacción</option>
              <option value="donación">Donación</option>
              <option value="intercambio">Intercambio</option>
              <option value="venta">Venta</option>
            </select>

            <select
              className="px-3 py-2 border rounded"
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
            </select>
          </div>
        </form>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>
      )}

      {/* Items grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="bg-white animate-pulse rounded shadow p-4 h-56" />
            ))}
          </div>
        ) : itemsData.items.length === 0 ? (
          <div className="bg-white rounded shadow p-6 text-center text-green-700">No se encontraron artículos.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {itemsData.items
              .filter(item => item.active === true)
              .map(item => (
                <article key={item._id || item.id} className="bg-white rounded shadow overflow-hidden flex flex-col">
                  <div className="h-44 bg-green-50/50">
                    {item.imagePath ? (
                      <img
                        src={item.imagePath}
                        alt={item.title}
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="w-full h-44 flex items-center justify-center text-green-400">Sin imagen</div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">{item.title}</h3>
                        <div className="text-sm text-green-700/80">{item.category} • {item.condition}</div>
                      </div>

                      {/* Favorite button */}
                      <button
                        onClick={() => handleToggleFavorite(item._id)}
                        title={favoriteIds.has(String(item._id)) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        className="p-1 rounded hover:bg-green-50"
                      >
                        {favoriteIds.has(String(item._id)) ? (
                          <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21s-7-4.35-10-7.5C-0.2 10.6 3 6 7 6c2.2 0 3.6 1.2 5 3.1C13.4 7.2 14.8 6 17 6c4 0 7.2 4.6 5 7.5C19 16.65 12 21 12 21z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6c-1.6-1.9-4.4-2.1-6.2-.6L12 6l-2.6-2c-1.8-1.5-4.6-1.3-6.2.6-2 2.4-1 6.4 2 9.4L12 21l6.8-7.0c3.0-3.0 4.0-7.0 2-9.4z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="mt-3 flex-1">
                      <p className="text-sm text-green-700/80 line-clamp-3">{item.description}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <Price price={item.price} transactionType={item.transactionType} />
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-green-600/80">{item.transactionType}</span>
                        <Link to={`/items/${item._id}`} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                          Ver más
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-green-700">
          Mostrando {(itemsData.items.length > 0) ? ((page - 1) * limit) + 1 : 0} - {Math.min(page * limit, itemsData.total)} de {itemsData.total} artículos
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => gotoPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded border border-green-200 bg-white text-green-700 disabled:opacity-50"
          >
            Anterior
          </button>

          <div className="px-3 py-1 rounded bg-white border border-green-100 text-sm">
            {page} / {totalPages}
          </div>

          <button
            onClick={() => gotoPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border border-green-200 bg-white text-green-700 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
