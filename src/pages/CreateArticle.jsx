import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem, getMe } from '../api';

const DEFAULT_CATEGORIES = [
  'Ropa',
  'Electrónica',
  'Libros',
  'Muebles',
  'Herramientas',
  'Juguetes',
  'Electrodomésticos',
  'Accesorios de hogar',
  'Materiales de reciclaje',
  'Cables y alambres',
  'Botellas y contenedores',
  'Tubos PVC',
  'Metal y fierro',
  'Plásticos',
  'Artículos deportivos',
  'Computación',
  'Partes y componentes',
  'Instrumentos musicales',
  'Decoración',
  'Cocina',
  'Mascotas',
  'Otros'
];

const CONDITIONS = ['nuevo', 'buen estado', 'usado'];
const TRANSACTION_TYPES = ['donación', 'intercambio', 'venta'];

export default function CreateArticle() {
  const navigate = useNavigate();

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('buen estado');
  const [transactionType, setTransactionType] = useState('donación');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // prefill location from user profile if available
  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      try {
        const me = await getMe();
        if (!mounted) return;
        if (me?.city) setLocation(me.city);
      } catch (e) {
        // ignore
      }
    }
    loadMe();
    return () => { mounted = false; };
  }, []);

  // image preview
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function onImageChange(e) {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  function effectiveCategory() {
    return category;
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setError(null);

    // validation
    if (!title.trim()) return setError('El título es obligatorio.');
    if (!effectiveCategory()) return setError('Selecciona una categoría.');
    if (!transactionType) return setError('Selecciona un tipo de transacción.');
    if (transactionType === 'venta') {
      const p = Number(price);
      if (isNaN(p) || p <= 0) return setError('Ingresa un precio válido para venta.');
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: effectiveCategory(),
        condition,
        transactionType,
        price: transactionType === 'venta' ? Number(price) : 0,
        location: location.trim(),
        imageFile
      };

      const created = await createItem(payload);
      const id = created?._id || created?.id;

      if (id) navigate(`/items/${id}`);
      else navigate('/explore');
    } catch (err) {
      setError(err.message || 'Error creando la publicación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-green-800">Crear publicación</h1>
        <p className="text-sm text-green-700/80">Comparte lo que ya no usas: dona, intercambia o vende a bajo precio.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

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

        {/* CATEGORY + CONDITION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-green-700 block mb-1">Categoría *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              required
            >
              <option value="">Selecciona una categoría</option>
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-green-700 block mb-1">Estado</label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {CONDITIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TRANSACTION TYPE + PRICE + CITY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm text-green-700 block mb-1">Tipo de transacción *</label>
            <select
              value={transactionType}
              onChange={e => setTransactionType(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {TRANSACTION_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
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
          </div>

          <div>
            <label className="text-sm text-green-700 block mb-1">Ubicación *</label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              required
            >
              <option value="">Selecciona tu ciudad</option>
              <option value="Monterrey">Monterrey</option>
              <option value="San Nicolás de los Garza">San Nicolás de los Garza</option>
              <option value="Guadalupe">Guadalupe</option>
              <option value="Apodaca">Apodaca</option>
              <option value="Santa Catarina">Santa Catarina</option>
              <option value="General Escobedo">General Escobedo</option>
              <option value="Juarez">Juárez</option>
              <option value="San Pedro Garza García">San Pedro Garza García</option>
            </select>
          </div>
        </div>

        {/* IMAGE */}
        <div>
          <label className="text-sm text-green-700 block mb-1">Imagen (opcional)</label>

          <div className="flex items-center gap-4">
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="hidden"
            />

            <label
              htmlFor="imageUpload"
              className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              Subir imagen
            </label>

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-28 h-20 object-cover rounded-lg border shadow-sm"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-500 shadow hover:bg-red-50"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="text-xs text-green-600 mt-2">
            Recomendado: foto clara del artículo. Si no subes imagen,
            aparecerá un placeholder.
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/my-items')}
            className="px-4 py-2 rounded border text-green-700 hover:bg-green-50"
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
}
