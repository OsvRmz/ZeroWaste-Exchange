import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getItem,
  toggleFavorite,
  deleteItem,
  getMyFavorites,
  getMe,
  getMyItems // para proponer intercambio (mis artículos)
} from '../api';

// transactions consumer
import { createTransactionRequest, getIncomingRequests, getOutgoingRequests } from '../api/transactions';

// nuevo: componente de reporte separado
import ReportModal from '../components/ReportModal';

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
  const [reportSuccessMessage, setReportSuccessMessage] = useState(null);

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

  // Linked transaction (if any) that references this item as proposedItem OR item
  const [linkedTx, setLinkedTx] = useState(null);
  const [loadingLinkedTx, setLoadingLinkedTx] = useState(false);

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
        // filtrar solo activos para no mostrar items no disponibles
        setMyItems((items || []).filter(it => it.active !== false));
      } catch (e) {
        setMyItems([]);
      } finally {
        if (mounted) setLoadingMyItems(false);
      }
    }

    if (item?.transactionType === 'intercambio') {
      loadMyItems();
    }
    return () => { mounted = false; };
  }, [item]);

  // Buscar transacción relacionada (incoming/outgoing) que reference este item
  useEffect(() => {
    if (!item || !currentUser) {
      setLinkedTx(null);
      return;
    }
    let mounted = true;
    async function loadLinked() {
      setLoadingLinkedTx(true);
      try {
        // pedimos both incoming & outgoing (endpoints existentes)
        const [incRes, outRes] = await Promise.all([getIncomingRequests({ page: 1, limit: 100 }), getOutgoingRequests({ page: 1, limit: 100 })]);

        const inc = (incRes && incRes.requests) ? incRes.requests : (Array.isArray(incRes) ? incRes : []);
        const out = (outRes && outRes.requests) ? outRes.requests : (Array.isArray(outRes) ? outRes : []);

        const txs = [...inc, ...out];

        // buscamos una tx que incluya este item en proposedItem OR item
        const found = txs.find(tx => {
          const proposedId = String(tx.proposedItem?._id || tx.proposedItem?.id || tx.proposedItem || '');
          const itemId = String(tx.item?._id || tx.item?.id || tx.item || '');
          const targetId = String(item._id || item.id);
          // excluir transacciones cerradas
          if (['cancelled', 'completed', 'rejected'].includes(tx.status)) return false;
          return proposedId === targetId || itemId === targetId;
        });

        if (!mounted) return;
        setLinkedTx(found || null);
      } catch (e) {
        if (!mounted) return;
        setLinkedTx(null);
      } finally {
        if (mounted) setLoadingLinkedTx(false);
      }
    }
    loadLinked();
    return () => { mounted = false; };
  }, [item, currentUser]);

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
      if (err?.status === 401) {
        navigate('/login');
        return;
      }
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
      navigate('/explore');
    } catch (err) {
      setError(err.message || 'Error al eliminar');
    } finally {
      setActionLoading(false);
    }
  }

  // Open report modal; prefill email if currentUser
  function openReport() {
    setReportSuccessMessage(null);
    setShowReport(true);
  }

  // callback from ReportModal
  function handleReportSuccess(msg) {
    setReportSuccessMessage(msg);
    setShowReport(false); // cierro modal automáticamente al tener éxito (opcional)
  }

  async function submitRequest(e) {
    e?.preventDefault();
    if (!item) return;
    if (!requestMessage.trim()) {
      setRequestError('Escribe un mensaje para el propietario.');
      return;
    }
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

      await createTransactionRequest(body);
      setRequestSuccess('Solicitud enviada. Revisa tus solicitudes en el dashboard.');
      setTimeout(() => setShowRequest(false), 1200);
    } catch (err) {
      setRequestError(err.message || 'Error enviando la solicitud');
    } finally {
      setRequestLoading(false);
    }
  }

  // Ownership check
  const isOwner = !!(currentUser && item && String(currentUser._id || currentUser.id) === String(item.owner?._id || item.owner?.id || item.owner));

  // helpers...
  function getAcceptLabel(tx) {
    const t = tx?.item?.transactionType || item.transactionType;
    if (t === 'donación') return 'Aceptar donación';
    if (t === 'venta') return 'Aceptar compra';
    if (t === 'intercambio') return 'Aceptar intercambio';
    return 'Aceptar';
  }

  const amOwnerOfLinkedTx = !!(linkedTx && currentUser && String(currentUser._id || currentUser.id) === String(linkedTx.owner?._id || linkedTx.owner?.id || linkedTx.owner));
  const amRequesterOfLinkedTx = !!(linkedTx && currentUser && String(currentUser._1d || currentUser.id) === String(linkedTx.requester?._id || linkedTx.requester?.id || linkedTx.requester));

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
      {/* ... contenido existente (igual que antes) ... */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-green-800">{item.title}</h1>
          <div className="text-sm text-green-700/80 mt-1">
            {item.category} • {item.condition} • {new Date(item.createdAt || item.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center gap-3">
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

          {isOwner && (
            <>
              <Link to={`/items/${item._id}/edit`} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm">Editar</Link>
              <button onClick={handleDelete} disabled={actionLoading} className="px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-sm">Eliminar</button>
            </>
          )}
        </div>
      </div>

      {/* ... resto del layout (imagen, descripción, aside con botones) ... */}
      <div className="bg-white rounded shadow overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        <div className="md:col-span-2">
          {item.imagePath ? (
            <img src={item.imagePath} alt={item.title} className="w-full h-96 object-cover rounded" />
          ) : (
            <div className="w-full h-96 bg-green-50 flex items-center justify-center text-green-400 rounded">Sin imagen</div>
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
            {linkedTx && (
              <>
                <div className="text-xs text-green-700/80">Existe una solicitud relacionada:</div>

                {amOwnerOfLinkedTx ? (
                  <button
                    onClick={() => {
                      const q = `?tab=transactions&tx=incoming&openTx=${encodeURIComponent(linkedTx._id)}`;
                      navigate(`/dashboard${q}`);
                    }}
                    className="w-full px-3 py-2 rounded bg-green-800 text-white hover:bg-green-900 text-sm"
                    title="Ir al dashboard para revisar y aceptar la solicitud"
                    disabled={loadingLinkedTx}
                  >
                    {getAcceptLabel(linkedTx)}
                  </button>
                ) : amRequesterOfLinkedTx ? (
                  <button
                    onClick={() => {
                      const q = `?tab=transactions&tx=outgoing&openTx=${encodeURIComponent(linkedTx._id)}`;
                      navigate(`/dashboard${q}`);
                    }}
                    className="w-full px-3 py-2 rounded bg-white border border-green-100 text-green-700 hover:bg-green-50 text-sm"
                    title="Ir al dashboard para ver tu solicitud"
                    disabled={loadingLinkedTx}
                  >
                    Ver mi solicitud
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const q = `?tab=transactions&tx=incoming&openTx=${encodeURIComponent(linkedTx._id)}`;
                      navigate(`/dashboard${q}`);
                    }}
                    className="w-full px-3 py-2 rounded bg-white border border-green-100 text-green-700 hover:bg-green-50 text-sm"
                    disabled={loadingLinkedTx}
                  >
                    Ver solicitud relacionada
                  </button>
                )}
              </>
            )}

            {!isOwner && !amOwnerOfLinkedTx && (
              <button onClick={() => setShowRequest(true)} className="w-full px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm">
                {item.transactionType === 'donación' ? 'Solicitar donación' :
                  item.transactionType === 'intercambio' ? 'Proponer intercambio' :
                  item.transactionType === 'venta' ? 'Solicitar compra' : 'Iniciar transacción'}
              </button>
            )}

            <button onClick={openReport} className="w-full px-3 py-2 rounded bg-white border border-green-200 text-sm text-green-700 hover:bg-green-50">
              Reportar publicación
            </button>

            <Link to="/explore" className="mt-2 block text-center text-sm text-green-600 underline">Volver a explorar</Link>
          </div>
        </aside>
      </div>

      {/* ReportModal: componente separado */}
      {showReport && (
        <ReportModal
          itemId={item._id}
          initialEmail={currentUser?.email || ''}
          onClose={() => setShowReport(false)}
          onSuccess={handleReportSuccess}
        />
      )}

      {/* mostrar mensaje de éxito si lo hubo */}
      {reportSuccessMessage && (
        <div className="p-3 bg-green-50 text-green-700 rounded">
          {reportSuccessMessage}
        </div>
      )}

      {/* Transaction request modal (sin cambios funcionales) */}
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
                  <button type="button" onClick={() => setShowRequest(false)} className="px-3 py-2 rounded border text-green-700">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
