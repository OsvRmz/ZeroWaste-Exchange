import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getMyItems,
  getMyFavorites,
  getMyStats,
  deleteItem,
  toggleFavorite,
  getMe
} from '../api';

import {
  getIncomingRequests,
  getOutgoingRequests,
  respondToTransactionRequest,
  cancelTransactionRequest,
  completeTransactionRequest
} from '../api/transactions';

import TransactionEmailModal from '../components/TransactionEmailModal';


function ItemCard({ item, onEdit, onDelete, onToggleFav, isFavorite }) {
  return (
    <article className={`bg-white rounded shadow overflow-hidden flex flex-col ${!item.active ? 'opacity-50' : ''}`}>
      <div className="h-36 bg-green-50/50 relative">
        {item.imagePath ? (
          <img src={item.imagePath} alt={item.title} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 flex items-center justify-center text-green-400">Sin imagen</div>
        )}
        {!item.active && (
          <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">Finalizada</span>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-md font-semibold text-green-800">{item.title}</h3>
            <div className="text-xs text-green-700/80">{item.category} • {item.condition}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFav(item._id)}
              className="p-1 rounded hover:bg-green-50"
              title={isFavorite ? 'Quitar favorito' : 'Agregar a favoritos'}
            >
              {isFavorite ? (
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21s-7-4.35-10-7.5C-0.2 10.6 3 6 7 6c2.2 0 3.6 1.2 5 3.1C13.4 7.2 14.8 6 17 6c4 0 7.2 4.6 5 7.5C19 16.65 12 21 12 21z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6c-1.6-1.9-4.4-2.1-6.2-.6L12 6l-2.6-2c-1.8-1.5-4.6-1.3-6.2.6-2 2.4-1 6.4 2 9.4L12 21l6.8-7.0c3.0-3.0 4.0-7.0 2-9.4z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => onEdit(item._id)}
              className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              disabled={!item.active}
            >
              Editar
            </button>

            <button
              onClick={() => onDelete(item._id)}
              className="px-2 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
              disabled={!item.active}
            >
              Eliminar
            </button>
          </div>
        </div>

        <div className="mt-2 flex-1">
          <p className="text-sm text-green-700/80 line-clamp-3">{item.description}</p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-green-800 font-medium">
            {item.transactionType === 'venta'
              ? `$ ${Number(item.price).toFixed(2)}`
              : item.transactionType === 'donación'
                ? 'Donación'
                : 'Intercambio'}
          </div>
          <Link to={`/items/${item._id}`} className="text-sm text-green-600 underline">Ver más</Link>
        </div>
      </div>
    </article>
  );
}


export default function Dashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('my-items'); // 'my-items' | 'favorites' | 'profile' | 'transactions'
  const [txSubTab, setTxSubTab] = useState('incoming'); // 'incoming' | 'outgoing'

  const [myItems, setMyItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ totalPublished: 0, totalFavorites: 0 });
  const [user, setUser] = useState(null);

  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  // Transactions
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loadingIncoming, setLoadingIncoming] = useState(false);
  const [loadingOutgoing, setLoadingOutgoing] = useState(false);

  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null); // id of request being processed

  // Modal state for emailing / confirming
  const [modalTx, setModalTx] = useState(null);
  const [modalRole, setModalRole] = useState('requester'); // 'requester' | 'owner'
  const [showModal, setShowModal] = useState(false);

  /* ----------------- Load initial profile + stats ----------------- */
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoadingUser(true);
      setError(null);
      try {
        const [me, st] = await Promise.all([getMe(), getMyStats()]);
        if (!mounted) return;
        setUser(me);
        setStats(st || { totalPublished: 0, totalFavorites: 0 });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Error cargando perfil');
      } finally {
        if (mounted) setLoadingUser(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  /* ----------------- Load my items ----------------- */
  useEffect(() => {
    let mounted = true;
    async function loadItems() {
      setLoadingItems(true);
      try {
        const items = await getMyItems();
        if (!mounted) return;
        setMyItems(items || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Error cargando tus publicaciones');
      } finally {
        if (mounted) setLoadingItems(false);
      }
    }
    loadItems();
    return () => { mounted = false; };
  }, []);

  /* ----------------- Load favorites ----------------- */
  useEffect(() => {
    let mounted = true;
    async function loadFavs() {
      setLoadingFavs(true);
      try {
        const favs = await getMyFavorites();
        if (!mounted) return;
        setFavorites(favs || []);
      } catch (err) {
        if (!mounted) return;
        setFavorites([]);
      } finally {
        if (mounted) setLoadingFavs(false);
      }
    }
    loadFavs();
    return () => { mounted = false; };
  }, []);

  /* ----------------- Load transactions (entrantes y salientes) ----------------- */
  useEffect(() => {
    let mounted = true;
    async function loadIncoming() {
      setLoadingIncoming(true);
      try {
        const res = await getIncomingRequests({ page: 1, limit: 50 });
        if (!mounted) return;
        setIncoming(res.requests || res || []);
      } catch (err) {
        if (!mounted) return;
        setIncoming([]);
      } finally {
        if (mounted) setLoadingIncoming(false);
      }
    }
    async function loadOutgoing() {
      setLoadingOutgoing(true);
      try {
        const res = await getOutgoingRequests({ page: 1, limit: 50 });
        if (!mounted) return;
        setOutgoing(res.requests || res || []);
      } catch (err) {
        if (!mounted) return;
        setOutgoing([]);
      } finally {
        if (mounted) setLoadingOutgoing(false);
      }
    }

    // load both (cheap) so user can toggle quickly
    loadIncoming();
    loadOutgoing();

    return () => { mounted = false; };
  }, []);

  /* ----------------- Item actions ----------------- */
  async function handleEdit(itemId) {
    navigate(`/items/${itemId}/edit`);
  }

  async function handleDelete(itemId) {
    const ok = window.confirm('¿Eliminar esta publicación? (Se marcará como inactiva)');
    if (!ok) return;
    setActionLoadingId(itemId);
    setError(null);
    try {
      await deleteItem(itemId);
      setMyItems(prev => prev.filter(it => String(it._id) !== String(itemId)));
      setFavorites(prev => prev.filter(it => String(it._id) !== String(itemId)));
      setStats(prev => ({ ...prev, totalPublished: Math.max(0, (prev.totalPublished || 1) - 1) }));
    } catch (err) {
      setError(err.message || 'Error al eliminar la publicación');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleToggleFavorite(itemId) {
    setActionLoadingId(itemId);
    setError(null);
    try {
      const res = await toggleFavorite(itemId);
      if (Array.isArray(res)) {
        setFavorites(res);
        setStats(prev => ({ ...prev, totalFavorites: res.length }));
      } else {
        const favs = await getMyFavorites();
        setFavorites(favs || []);
        setStats(prev => ({ ...prev, totalFavorites: favs.length }));
      }
    } catch (err) {
      setError(err.message || 'Error actualizando favoritos');
    } finally {
      setActionLoadingId(null);
    }
  }

  /* ----------------- Transaction helpers ----------------- */
  async function refreshTransactions() {
    try {
      setLoadingIncoming(true);
      setLoadingOutgoing(true);
      const [incRes, outRes] = await Promise.all([
        getIncomingRequests({ page: 1, limit: 50 }),
        getOutgoingRequests({ page: 1, limit: 50 })
      ]);
      setIncoming(incRes.requests || incRes || []);
      setOutgoing(outRes.requests || outRes || []);
    } catch (err) {
      setError(err?.message || 'Error cargando solicitudes');
    } finally {
      setLoadingIncoming(false);
      setLoadingOutgoing(false);
    }
  }

  function openModalForTx(tx, role = 'requester') {
    setModalTx(tx);
    setModalRole(role);
    setShowModal(true);
  }

  async function handleRespond(txId, action) {
    // action: 'accepted' | 'rejected' | 'completed'
    if (!['accepted', 'rejected', 'completed'].includes(action)) return;
    const confirmMsg = action === 'accepted' ? '¿Aceptar esta solicitud?' :
      action === 'rejected' ? '¿Rechazar esta solicitud?' :
        '¿Marcar como completada? (Esto no marcará el artículo como inactivo automáticamente)';
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(txId);
    setError(null);
    try {
      const res = await respondToTransactionRequest(txId, { status: action });
      // si la respuesta fue "accepted" abrimos modal para coordinar (owner)
      await refreshTransactions();
      if (action === 'accepted') {
        // preferir la transacción retornada por el endpoint; si no viene, buscar en incoming
        const tx = res || incoming.find(i => String(i._id) === String(txId)) || outgoing.find(o => String(o._id) === String(txId));
        openModalForTx(tx, 'owner');
      }
    } catch (err) {
      setError(err?.message || 'Error respondiendo la solicitud');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCancel(txId) {
    if (!window.confirm('¿Cancelar esta solicitud?')) return;
    setActionLoadingId(txId);
    setError(null);
    try {
      await cancelTransactionRequest(txId);
      await refreshTransactions();
    } catch (err) {
      setError(err?.message || 'Error cancelando la solicitud');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleComplete(txId) {
    if (!window.confirm('Marcar como completada?')) return;
    setActionLoadingId(txId);
    setError(null);
    try {
      await completeTransactionRequest(txId);
      await refreshTransactions();
      setShowModal(false);
    } catch (err) {
      setError(err?.message || 'Error marcando completa la solicitud');
    } finally {
      setActionLoadingId(null);
    }
  }

  /* ----------------- Render ----------------- */
  if (loadingUser) {
    return <div className="animate-pulse p-6 bg-white rounded shadow">Cargando dashboard...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-green-800">Mi panel</h1>
          <p className="text-sm text-green-700/80">Gestiona tus publicaciones, solicitudes, favoritos e información.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/items/create" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Crear publicación</Link>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-green-700">Publicaciones</div>
          <div className="text-2xl font-semibold text-green-800">{stats.totalPublished ?? myItems.length}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-green-700">Favoritos</div>
          <div className="text-2xl font-semibold text-green-800">{stats.totalFavorites ?? favorites.length}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-green-700">Solicitudes entrantes</div>
          <div className="text-2xl font-semibold text-green-800">{incoming.length}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-green-700">Solicitudes enviadas</div>
          <div className="text-2xl font-semibold text-green-800">{outgoing.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <nav className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('my-items')}
            className={`px-3 py-2 rounded ${activeTab === 'my-items' ? 'bg-green-600 text-white' : 'bg-white border border-green-100 text-green-700'}`}
          >
            Mis publicaciones
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-2 rounded ${activeTab === 'favorites' ? 'bg-green-600 text-white' : 'bg-white border border-green-100 text-green-700'}`}
          >
            Favoritos
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-2 rounded ${activeTab === 'transactions' ? 'bg-green-600 text-white' : 'bg-white border border-green-100 text-green-700'}`}
          >
            Solicitudes
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 rounded ${activeTab === 'profile' ? 'bg-green-600 text-white' : 'bg-white border border-green-100 text-green-700'}`}
          >
            Mi información
          </button>
        </nav>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

      {/* Content */}
      <div>
        {activeTab === 'my-items' && (
          <section>
            {loadingItems ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-white animate-pulse rounded" />)}
              </div>
            ) : myItems.length === 0 ? (
              <div className="bg-white rounded shadow p-6 text-center text-green-700">
                No tienes publicaciones todavía.
                <div className="mt-4">
                  <Link to="/items/create" className="px-4 py-2 bg-green-600 text-white rounded">Crear mi primera publicación</Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myItems.map(item => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFav={handleToggleFavorite}
                    isFavorite={favorites.some(f => String(f._id) === String(item._id))}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'favorites' && (
          <section>
            {loadingFavs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-white.animate-pulse rounded" />)}
              </div>
            ) : favorites.length === 0 ? (
              <div className="bg-white rounded shadow p-6 text-center text-green-700">
                No tienes favoritos.
                <div className="mt-4">
                  <Link to="/explore" className="px-4 py-2 bg-green-600 text-white rounded">Explorar artículos</Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map(item => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    onEdit={id => navigate(`/items/${id}/edit`)}
                    onDelete={id => handleDelete(id)}
                    onToggleFav={handleToggleFavorite}
                    isFavorite={true}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'transactions' && (
          <section>
            {/* Subtabs: incoming / outgoing */}
            <div className="mb-4 flex gap-2 items-center">
              <button
                onClick={() => setTxSubTab('incoming')}
                className={`px-3 py-2 rounded ${txSubTab === 'incoming' ? 'bg-green-600 text-white' : 'bg-white border border-green-100 text-green-700'}`}
              >
                Entrantes
              </button>
              <button
                onClick={() => setTxSubTab('outgoing')}
                className={`px-3 py-2 rounded ${txSubTab === 'outgoing' ? 'bg-green-600 text-white' : 'bg-white border border-green-100 text-green-700'}`}
              >
                Enviadas
              </button>

              <button onClick={() => refreshTransactions()} className="ml-auto px-3 py-2 rounded bg-white border border-green-100 text-green-700">
                Refrescar
              </button>
            </div>

            {/* Incoming */}
            {txSubTab === 'incoming' && (
              <div>
                {loadingIncoming ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-white animate-pulse rounded" />)}
                  </div>
                ) : incoming.length === 0 ? (
                  <div className="bg-white rounded shadow p-6 text-center text-green-700">
                    No tienes solicitudes entrantes.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incoming.map(tx => (
                      <div key={tx._id} className="bg-white rounded shadow p-4 flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-2/3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-green-700">Artículo</div>
                              <div className={`font-medium text-green-800 ${tx.status == "completed" ? 'line-through' : ''}`}>
                                {tx.item?.title || '—'}
                              </div>
                              <div className="text-xs text-green-700 mt-1">{tx.item?.category} • {tx.item?.condition}</div>
                            </div>

                            <div className="text-sm text-green-600">{new Date(tx.createdAt).toLocaleString()}</div>
                          </div>

                          <div className="mt-3 text-sm text-green-700">
                            <strong>Solicitante:</strong> {tx.requester?.name || 'Usuario'} — <a className="underline text-green-600" href={`mailto:${tx.requester?.email}`}>{tx.requester?.email}</a>
                          </div>

                          <div className="mt-2 text-sm text-green-700 whitespace-pre-line">
                            <strong>Mensaje:</strong> {tx.message}
                          </div>

                          {tx.offeredPrice !== undefined && (
                            <div className="mt-2 text-sm text-green-700"><strong>Oferta:</strong> ${Number(tx.offeredPrice).toFixed(2)}</div>
                          )}

                          {tx.proposedItem && (
                            <div className="mt-2 text-sm text-green-700"><strong>Propone intercambiar con:</strong> {tx.proposedItem.title}</div>
                          )}

                          <div className="mt-2 text-sm">
                            <span className="px-2 py-1 rounded bg-green-50 text-green-700">{tx.status}</span>
                          </div>
                        </div>

                        <div className="w-full sm:w-1/3 flex flex-col items-stretch justify-center gap-2">
                          {/* Actions allowed: owner can accept/reject/complete; can also cancel */}
                          <button
                            disabled={actionLoadingId === tx._id || tx.status !== 'pending'}
                            onClick={() => handleRespond(tx._id, 'accepted')}
                            className="w-full px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Aceptar
                          </button>

                          <button
                            disabled={actionLoadingId === tx._id || tx.status !== 'pending'}
                            onClick={() => handleRespond(tx._id, 'rejected')}
                            className="w-full px-3 py-2 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Rechazar
                          </button>

                          <button
                            disabled={actionLoadingId === tx._id || tx.status === 'completed'}
                            onClick={() => handleComplete(tx._id)}
                            className="w-full px-3 py-2 rounded bg-white border border-green-100 text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            Marcar completada
                          </button>

                          <Link to={`/items/${tx.item?._id || tx.item?.id}`} className="w-full text-center text-sm text-green-600 underline">Ver artículo</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Outgoing */}
            {txSubTab === 'outgoing' && (
              <div>
                {loadingOutgoing ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-white animate-pulse rounded" />)}
                  </div>
                ) : outgoing.length === 0 ? (
                  <div className="bg-white rounded shadow p-6 text-center text-green-700">
                    No tienes solicitudes enviadas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outgoing.map(tx => (
                      <div key={tx._id} className="bg-white rounded shadow p-4 flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-2/3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-green-700">Artículo</div>
                              <div className={`font-medium text-green-800 ${tx.status == "completed" ? 'line-through' : ''}`}>
                                {tx.item?.title || '—'}
                              </div>
                              <div className="text-xs text-green-700 mt-1">{tx.item?.category} • {tx.item?.condition}</div>
                            </div>

                            <div className="text-sm text-green-600">{new Date(tx.createdAt).toLocaleString()}</div>
                          </div>

                          <div className="mt-3 text-sm text-green-700">
                            <strong>Propietario:</strong> {tx.owner?.name || 'Usuario'} — <a className="underline text-green-600" href={`mailto:${tx.owner?.email}`}>{tx.owner?.email}</a>
                          </div>

                          <div className="mt-2 text-sm text-green-700 whitespace-pre-line">
                            <strong>Tu mensaje:</strong> {tx.message}
                          </div>

                          <div className="mt-2 text-sm">
                            <span className="px-2 py-1 rounded bg-green-50 text-green-700">{tx.status}</span>
                          </div>
                        </div>

                        <div className="w-full sm:w-1/3 flex flex-col items-stretch justify-center gap-2">
                          {/* Requester can cancel if pending; can mark completed if accepted */}
                          {tx.status === 'pending' && (
                            <button
                              disabled={actionLoadingId === tx._id}
                              onClick={() => handleCancel(tx._id)}
                              className="w-full px-3 py-2 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancelar solicitud
                            </button>
                          )}

                          {tx.status === 'accepted' && (
                            <>
                              <button
                                disabled={actionLoadingId === tx._id}
                                onClick={() => openModalForTx(tx, 'requester')}
                                className="w-full px-3 py-2 rounded bg-white border border-green-100 text-green-700 hover:bg-green-50 disabled:opacity-50"
                              >
                                Contactar y coordinar (abrir correo)
                              </button>

                              <button
                                disabled={actionLoadingId === tx._id}
                                onClick={() => handleComplete(tx._id)}
                                className="w-full px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Marcar completada
                              </button>
                            </>
                          )}

                          <Link to={`/items/${tx.item?._id || tx.item?.id}`} className="w-full text-center text-sm text-green-600 underline">Ver artículo</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="bg-white rounded shadow p-6">
            <div className="flex items-center gap-4">
              <div>
                {user?.photo ? (
                  <img src={user.photo} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-medium">
                    {user?.name ? user.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="text-lg font-semibold text-green-800">{user?.name || 'Usuario'}</div>
                <div className="text-sm text-green-700">{user?.city || 'Ciudad no definida'}</div>
                <div className="text-sm text-green-700 mt-1">
                  <a href={`mailto:${user?.email}`} className="underline">{user?.email}</a>
                </div>
              </div>

              <div>
                <Link to="/profile/edit" className="px-3 py-2 bg-white border border-green-200 rounded text-green-700 hover:bg-green-50">Editar perfil</Link>
              </div>
            </div>

            <div className="mt-6 text-sm text-green-700">
              <div><strong>Publicaciones:</strong> {stats.totalPublished ?? myItems.length}</div>
              <div><strong>Favoritos:</strong> {stats.totalFavorites ?? favorites.length}</div>
            </div>
          </section>
        )}
      </div>

      {/* Transaction coordination modal */}
      {showModal && modalTx && (
        <TransactionEmailModal
          tx={modalTx}
          role={modalRole}
          me={user}
          onClose={() => setShowModal(false)}
          onMarkCompleted={handleComplete}
        />
      )}
    </div>
  );
}
