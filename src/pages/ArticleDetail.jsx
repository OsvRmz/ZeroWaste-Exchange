// src/pages/ArticleDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getItem,
  toggleFavorite,
  deleteItem,
  createReport,
  getMyFavorites,
  getMe,
  getMyItems // para proponer intercambio (mis artículos)
} from '../api';

// transactions consumer
import { createTransactionRequest } from '../api/transactions';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Report modal state
  const [showReport, setShowReport] = useState(false);
  const [reportEmail, setReportEmail] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);

  // Transaction request modal state
  const [showRequest, setShowRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestOfferedPrice, setRequestOfferedPrice] = useState('');
  const [requestProposedItemId, setRequestProposedItemId] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);
  const [requestError, setRequestError] = useState(null);

  // Current user (to check ownership / prefill report email)
  const [currentUser, setCurrentUser] = useState(null);

  // My items (for proposing an item in case of intercambio)
  const [myItems, setMyItems] = useState([]);
  const [loadingMyItems, setLoadingMyItems] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getItem(id);
        if (!mounted) return;
        setItem(data);

        // try to load favorites (if logged)
        try {
          const favs = await getMyFavorites();
          if (!mounted) return;
          const ids = new Set((favs || []).map(i => String(i._id || i.id)));
          setFavIds(ids);
        } catch (e) {
          // not logged or no favorites — just ignore
          setFavIds(new Set());
        }

        // try to get current user profile (to enable edit/delete)
        try {
          const me = await getMe();
          if (!mounted) return;
          setCurrentUser(me);
        } catch (e) {
          setCurrentUser(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Error cargando el artículo');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // Cargar mis artículos (solo si voy a proponer intercambio)
  useEffect(() => {
    let mounted = true;
    async function loadMyItems() {
      setLoadingMyItems(true);
      try {
        const items = await getMyItems();
        if (!mounted) return;
        setMyItems(items || []);
      } catch (e) {
        setMyItems([]);
      } finally {
        if (mounted) setLoadingMyItems(false);
      }
    }

    // cargar solo si necesitamos proponer intercambio y el usuario existe
    if (item?.transactionType === 'intercambio') {
      loadMyItems();
    }
    return () => { mounted = false; };
  }, [item]);

  // Favorito toggle
  async function handleToggleFav() {
    if (!item) return;
    setActionLoading(true);
    try {
      // optimistic UI toggle
      setFavIds(prev => {
        const next = new Set(prev);
        if (next.has(String(item._id))) next.delete(String(item._id));
        else next.add(String(item._id));
        return next;
      });

      const res = await toggleFavorite(item._id);
      if (Array.isArray(res)) {
        const ids = new Set(res.map(it => String(it._id || it.id)));
        setFavIds(ids);
      }
    } catch (err) {
      // if unauthorized, redirect to login
      if (err?.status === 401) {
        navigate('/login');
        return;
      }
      // revert optimistic toggle on error
      setFavIds(prev => {
        const next = new Set(prev);
        if (next.has(String(item._id))) next.delete(String(item._id));
        else next.add(String(item._id));
        return next;
      });
      setError(err.message || 'No se pudo actualizar favoritos');
    } finally {
      setActionLoading(false);
    }
  }

  // Delete item (mark inactive)
  async function handleDelete() {
    if (!item) return;
    const ok = window.confirm('¿Eliminar esta publicación? (Se marcará como inactiva)');
    if (!ok) return;
    setActionLoading(true);
    try {
      await deleteItem(item._id);
      // después de eliminar, llevar al explore
      navigate('/explore');
    } catch (err) {
      setError(err.message || 'Error al eliminar');
    } finally {
      setActionLoading(false);
    }
  }

  // Open report modal; prefill email if currentUser
  function openReport() {
    setReportSuccess(null);
    setReportReason('');
    setShowReport(true);
    setReportEmail(currentUser?.email || '');
  }

  async function submitReport(e) {
    e?.preventDefault();
    if (!item) return;
    setReportLoading(true);
    setReportSuccess(null);
    try {
      await createReport({ itemId: item._id, reporterEmail: reportEmail, reason: reportReason });
      setReportSuccess('Reporte enviado. Gracias por ayudar a mantener la comunidad.');
      setReportReason('');
    } catch (err) {
      setReportSuccess(null);
      setError(err.message || 'Error enviando el reporte');
    } finally {
      setReportLoading(false);
    }
  }

  // Open transaction request modal and reset state
  function openRequestModal() {
    setRequestSuccess(null);
    setRequestError(null);
    setRequestMessage('');
    setRequestOfferedPrice('');
    setRequestProposedItemId('');
    setShowRequest(true);
  }

  // Submit transaction request
  async function submitRequest(e) {
    e?.preventDefault();
    if (!item) return;
    if (!requestMessage.trim()) {
      setRequestError('Escribe un mensaje para el propietario.');
      return;
    }
    // If venta and offeredPrice provided, validate numeric
    if (item.transactionType === 'venta' && requestOfferedPrice) {
      const p = Number(requestOfferedPrice);
      if (isNaN(p) || p <= 0) {
        setRequestError('Ingresa un precio válido mayor a 0.');
        return;
      }
    }

    setRequestLoading(true);
    setRequestError(null);
    try {
      const body = {
        itemId: item._id,
        message: requestMessage.trim(),
        contactEmail: currentUser?.email || undefined
      };
      if (item.transactionType === 'venta' && requestOfferedPrice) {
        body.offeredPrice = Number(requestOfferedPrice);
      }
      if (item.transactionType === 'intercambio' && requestProposedItemId) {
        body.proposedItemId = requestProposedItemId;
      }

      const res = await createTransactionRequest(body);
      setRequestSuccess('Solicitud enviada. Revisa tus solicitudes en el dashboard.');
      // opcional: cerrar modal después de 1.2s
      setTimeout(() => {
        setShowRequest(false);
      }, 1200);
    } catch (err) {
      setRequestError(err.message || 'Error enviando la solicitud');
    } finally {
      setRequestLoading(false);
    }
  }

  // Ownership check
  const isOwner = !!(currentUser && item && String(currentUser._id || currentUser.id) === String(item.owner?._id || item.owner?.id || item.owner));

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-2/5 bg-green-100 rounded" />
        <div className="h-64 bg-white rounded shadow" />
        <div className="h-4 w-full bg-green-100 rounded" />
        <div className="h-4 w-3/4 bg-green-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded shadow text-red-600">
        {error}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white p-6 rounded shadow text-green-700">Artículo no encontrado.</div>
    );
  }

  const owner = item.owner || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-green-800">{item.title}</h1>
          <div className="text-sm text-green-700/80 mt-1">
            {item.category} • {item.condition} • {new Date(item.createdAt || item.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Favorite */}
          <button
            onClick={handleToggleFav}
            disabled={actionLoading}
            className="p-2 rounded-md hover:bg-green-50"
            title={favIds.has(String(item._id)) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {favIds.has(String(item._id)) ? (
              <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21s-7-4.35-10-7.5C-0.2 10.6 3 6 7 6c2.2 0 3.6 1.2 5 3.1C13.4 7.2 14.8 6 17 6c4 0 7.2 4.6 5 7.5C19 16.65 12 21 12 21z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6c-1.6-1.9-4.4-2.1-6.2-.6L12 6l-2.6-2c-1.8-1.5-4.6-1.3-6.2.6-2 2.4-1 6.4 2 9.4L12 21l6.8-7.0c3.0-3.0 4.0-7.0 2-9.4z" />
              </svg>
            )}
          </button>

          {/* If owner, show edit/delete */}
          {isOwner && (
            <>
              <Link to={`/items/${item._id}/edit`} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm">
                Editar
              </Link>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-sm"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content: image + details */}
      <div className="bg-white rounded shadow overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        <div className="md:col-span-2">
          {item.imagePath ? (
            <img src={item.imagePath} alt={item.title} className="w-full h-96 object-cover rounded" />
          ) : (
            <div className="w-full h-96 bg-green-50 flex items-center justify-center text-green-400 rounded">
              Sin imagen
            </div>
          )}

          <section className="mt-4">
            <h2 className="text-lg font-medium text-green-800 mb-2">Descripción</h2>
            <p className="text-green-700/90 whitespace-pre-line">{item.description || 'Sin descripción.'}</p>
          </section>
        </div>

        <aside className="p-4 bg-green-50 rounded-md space-y-4">
          <div>
            <div className="text-sm text-green-700">Transacción</div>
            <div className="mt-1 font-medium text-green-800">{item.transactionType}</div>
          </div>

          <div>
            <div className="text-sm text-green-700">Precio</div>
            <div className="mt-1 font-semibold text-green-800">{item.transactionType === 'venta' ? `$ ${Number(item.price).toFixed(2)}` : '—'}</div>
          </div>

          <div>
            <div className="text-sm text-green-700">Ubicación</div>
            <div className="mt-1 text-green-800">{item.location || 'No especificada'}</div>
          </div>

          <div className="border-t border-green-100 pt-3">
            <div className="text-sm text-green-700">Publicado por</div>
            <div className="mt-2 flex items-center gap-3">
              {owner.photo ? (
                <img src={owner.photo} alt={owner.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-medium">
                  {owner.name ? owner.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-green-800">{owner.name || 'Usuario'}</div>
                <div className="text-xs text-green-700">{owner.city || '—'}</div>
                <div className="text-xs text-green-700 mt-1">
                  <a href={`mailto:${owner.email}`} className="underline">{owner.email}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 space-y-2">
            {/* Transaction button: visible only if not owner */}
            {!isOwner && (
              <button
                onClick={openRequestModal}
                className="w-full px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
              >
                {item.transactionType === 'donación' ? 'Solicitar donación' :
                  item.transactionType === 'intercambio' ? 'Proponer intercambio' :
                  item.transactionType === 'venta' ? 'Solicitar compra' : 'Iniciar transacción'}
              </button>
            )}

            <button
              onClick={openReport}
              className="w-full px-3 py-2 rounded bg-white border border-green-200 text-sm text-green-700 hover:bg-green-50"
            >
              Reportar publicación
            </button>

            <Link to="/explore" className="mt-2 block text-center text-sm text-green-600 underline">Volver a explorar</Link>
          </div>
        </aside>
      </div>

      {/* Report modal (simple) */}
      {showReport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">Reportar publicación</h3>
              <button onClick={() => setShowReport(false)} className="text-green-600">Cerrar</button>
            </div>

            {reportSuccess ? (
              <div className="p-3 bg-green-50 text-green-700 rounded">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={submitReport} className="space-y-3">
                <div>
                  <label className="text-sm text-green-700">Tu correo (para seguimiento)</label>
                  <input
                    value={reportEmail}
                    onChange={e => setReportEmail(e.target.value)}
                    required
                    type="email"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>

                <div>
                  <label className="text-sm text-green-700">Motivo</label>
                  <textarea
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button type="submit" disabled={reportLoading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    {reportLoading ? 'Enviando...' : 'Enviar reporte'}
                  </button>
                  <button type="button" onClick={() => setShowReport(false)} className="px-3 py-2 rounded border text-green-700">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transaction request modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">
                {item.transactionType === 'donación' ? 'Solicitar donación' :
                  item.transactionType === 'intercambio' ? 'Proponer intercambio' :
                  item.transactionType === 'venta' ? 'Solicitar compra' : 'Iniciar transacción'}
              </h3>
              <button onClick={() => setShowRequest(false)} className="text-green-600">Cerrar</button>
            </div>

            {requestSuccess ? (
              <div className="p-3 bg-green-50 text-green-700 rounded">
                {requestSuccess}
              </div>
            ) : (
              <form onSubmit={submitRequest} className="space-y-3">
                <div>
                  <label className="text-sm text-green-700">Mensaje para el propietario</label>
                  <textarea
                    value={requestMessage}
                    onChange={e => setRequestMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Hola, estoy interesado en este artículo. ¿Aún está disponible?"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>

                {item.transactionType === 'venta' && (
                  <div>
                    <label className="text-sm text-green-700">Precio ofrecido (opcional)</label>
                    <input
                      value={requestOfferedPrice}
                      onChange={e => setRequestOfferedPrice(e.target.value)}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={`Precio sugerido — actual: ${item.price ? `$${Number(item.price).toFixed(2)}` : '—'}`}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                  </div>
                )}

                {item.transactionType === 'intercambio' && (
                  <div>
                    <label className="text-sm text-green-700">Ofrezco este artículo a cambio (opcional)</label>
                    <div>
                      {loadingMyItems ? (
                        <div className="text-sm text-green-700">Cargando tus artículos...</div>
                      ) : myItems.length === 0 ? (
                        <div className="text-sm text-green-700">No tienes artículos para proponer.</div>
                      ) : (
                        <select
                          value={requestProposedItemId}
                          onChange={e => setRequestProposedItemId(e.target.value)}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
                        >
                          <option value="">No propongo artículo</option>
                          {myItems.map(it => (
                            <option key={it._id || it.id} value={it._id || it.id}>
                              {it.title} {it.condition ? `(${it.condition})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {requestError && <div className="text-sm text-red-600">{requestError}</div>}

                <div className="flex items-center gap-2">
                  <button type="submit" disabled={requestLoading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    {requestLoading ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                  <button type="button" onClick={() => setShowRequest(false)} className="px-3 py-2 rounded border text-green-700">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
