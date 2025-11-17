// src/pages/EditArticle.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getItem, updateItem, deleteItem, getMe } from '../api';

const DEFAULT_CATEGORIES = ['Ropa', 'Electrónica', 'Libros', 'Mueble', 'Otros'];
const CONDITIONS = ['nuevo', 'buen estado', 'usado'];
const TRANSACTION_TYPES = ['donación', 'intercambio', 'venta'];

export default function EditArticle() {
  const { id } = useParams();
  const navigate = useNavigate();

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [condition, setCondition] = useState('buen estado');
  const [transactionType, setTransactionType] = useState('donación');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null); // new upload
  const [imagePreview, setImagePreview] = useState(null); // preview of new image
  const [currentImage, setCurrentImage] = useState(null); // existing imagePath from item

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [itemOwnerId, setItemOwnerId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const it = await getItem(id);
        if (!mounted) return;
        setTitle(it.title || '');
        setDescription(it.description || '');
        setCategory(it.category || '');
        setCustomCategory(''); // leave empty, prefer category field
        setCondition(it.condition || 'buen estado');
        setTransactionType(it.transactionType || 'donación');
        setPrice(it.price ? String(it.price) : '');
        setLocation(it.location || '');
        setCurrentImage(it.imagePath || null);
        setItemOwnerId(it.owner?._id || it.owner || null);

        // try to get current user (to confirm ownership)
        try {
          const me = await getMe();
          if (!mounted) return;
          setCurrentUser(me);
        } catch (e) {
          setCurrentUser(null);
        }
      } catch (err) {
        setError(err.message || 'Error cargando el artículo.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function effectiveCategory() {
    return customCategory.trim() !== '' ? customCategory.trim() : category;
  }

  function onImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  }

  async function handleSave(e) {
    e?.preventDefault();
    setError(null);

    if (!title.trim()) return setError('El título es obligatorio.');
    if (!effectiveCategory()) return setError('Selecciona o escribe una categoría.');
    if (!transactionType) return setError('Selecciona un tipo de transacción.');
    if (transactionType === 'venta') {
      const p = Number(price);
      if (isNaN(p) || p <= 0) return setError('Ingresa un precio válido para venta.');
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: effectiveCategory(),
        condition,
        transactionType,
        price: transactionType === 'venta' ? Number(price) : 0,
        location: location.trim()
      };
      if (imageFile) payload.imageFile = imageFile; // replace image if user uploaded new one

      const updated = await updateItem(id, payload);
      const updatedId = updated?._id || updated?.id || id;
      navigate(`/items/${updatedId}`);
    } catch (err) {
      setError(err.message || 'Error guardando cambios.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm('¿Eliminar esta publicación? (Se marcará como inactiva)');
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteItem(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al eliminar la publicación.');
    } finally {
      setDeleting(false);
    }
  }

  // Ownership check: show edit controls only to owner (but this page is for editing so ideally protected)
  const isOwner = currentUser && itemOwnerId && String(currentUser._id || currentUser.id) === String(itemOwnerId);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-2/5 bg-green-100 rounded" />
        <div className="h-48 bg-white rounded shadow" />
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

  if (!isOwner) {
    // if not owner, inform user (extra safety)
    return (
      <div className="bg-white p-6 rounded shadow text-green-800">
        No tienes permiso para editar esta publicación.
        <div className="mt-4">
          <Link to="/explore" className="text-sm text-green-600 underline">Volver a explorar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-green-800">Editar publicación</h1>
          <p className="text-sm text-green-700/80">Actualiza los detalles de tu artículo.</p>
        </div>
        <div className="text-sm text-green-600">
          Publicado por ti
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded shadow p-6 space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <div>
          <label className="text-sm text-green-700 block mb-1">Título *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej. Silla de madera en buen estado"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            required
          />
        </div>

        <div>
          <label className="text-sm text-green-700 block mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Detalles, medidas, marca, estado, etc."
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-green-700 block mb-1">Categoría *</label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setCustomCategory(''); }}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Selecciona una categoría</option>
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="text-xs text-green-600 mt-1">O escribe una categoría nueva abajo</div>
          </div>

          <div>
            <label className="text-sm text-green-700 block mb-1">Estado</label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-green-700 block mb-1">Categoría personalizada (opcional)</label>
          <input
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            placeholder="Ej. Juguetes, Herramientas, Decoración..."
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm text-green-700 block mb-1">Tipo de transacción *</label>
            <select
              value={transactionType}
              onChange={e => setTransactionType(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-green-700 block mb-1">Precio</label>
            <input
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder={transactionType === 'venta' ? 'Precio en MXN' : 'No aplica salvo venta'}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              type="number"
              step="0.01"
              min="0"
              disabled={transactionType !== 'venta'}
            />
            {transactionType !== 'venta' && <div className="text-xs text-green-600 mt-1">Precio solo si eliges "venta".</div>}
          </div>

          <div>
            <label className="text-sm text-green-700 block mb-1">Ubicación</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ciudad o colonia"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-green-700 block mb-1">Imagen</label>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start gap-2">
              <input type="file" accept="image/*" onChange={onImageChange} />
              <div className="text-xs text-green-600">Sube una nueva imagen para reemplazar la actual.</div>
            </div>

            <div className="flex gap-3 items-center">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="w-28 h-20 object-cover rounded border" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-500 shadow">×</button>
                </div>
              ) : currentImage ? (
                <div className="relative">
                  <img src={currentImage} alt="current" className="w-28 h-20 object-cover rounded border" />
                  <div className="text-xs text-green-600 mt-1">Imagen actual</div>
                </div>
              ) : (
                <div className="w-28 h-20 bg-green-50 flex items-center justify-center rounded border text-green-400">Sin imagen</div>
              )}
            </div>
          </div>
          <div className="text-xs text-green-600 mt-2">Nota: solo se puede reemplazar la imagen subiendo una nueva.</div>
        </div>

        <div className="flex items-center gap-3 justify-between">
          <div>
            <Link to={`/article/${id}`} className="px-3 py-2 rounded border text-green-700 hover:bg-green-50">Cancelar</Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 rounded border border-red-200 text-red-600 hover:bg-red-50"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
