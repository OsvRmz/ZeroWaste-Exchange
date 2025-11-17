import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateProfile } from '../api';

export default function EditProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState(''); // mostrado pero no editable
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cargar perfil al montar
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const me = await getMe();
        if (!mounted) return;
        setName(me.name || '');
        setCity(me.city || '');
        setEmail(me.email || '');
        setCurrentPhoto(me.photo || null);
      } catch (err) {
        setError(err.message || 'Error cargando perfil');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Generar preview de la nueva foto si se selecciona
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) setPhotoFile(f);
  }

  function removeSelectedPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  async function handleSave(e) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) return setError('El nombre es obligatorio.');

    setSaving(true);
    try {
      const payload = { name: name.trim(), city: city.trim() };
      if (photoFile) payload.photoFile = photoFile;
      const updated = await updateProfile(payload);
      // updateProfile devuelve el usuario actualizado
      setName(updated.name || name);
      setCity(updated.city || city);
      setCurrentPhoto(updated.photo || currentPhoto);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess('Perfil actualizado correctamente.');
      // opcional: redirigir después de un momento
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err) {
      setError(err.message || 'Error guardando cambios');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse p-6 bg-white rounded shadow">Cargando perfil...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-green-800">Editar perfil</h1>
        <p className="text-sm text-green-700/80">Actualiza tu nombre, ciudad o foto. El email no puede editarse.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded shadow p-6 space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
        {success && <div className="text-sm text-green-700 bg-green-50 p-2 rounded">{success}</div>}

        <div>
          <label className="text-sm text-green-700 block mb-1">Nombre *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            required
          />
        </div>

        <div>
          <label className="text-sm text-green-700 block mb-1">Ciudad</label>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="Ej. Monterrey"
          />
        </div>

        <div>
          <label className="text-sm text-green-700 block mb-1">Email (no editable)</label>
          <div className="px-3 py-2 border rounded bg-green-50 text-green-700">{email}</div>
        </div>

        <div>
          <label className="text-sm text-green-700 block mb-1">Foto de perfil (opcional)</label>
          <div className="flex items-center gap-4">
            <div>
              <input type="file" accept="image/*" onChange={onFileChange} />
              <div className="text-xs text-green-600 mt-1">Sube una foto para mostrar en tus publicaciones.</div>
            </div>

            <div className="flex items-center gap-3">
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="preview" className="w-20 h-20 object-cover rounded border" />
                  <button type="button" onClick={removeSelectedPhoto} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-500 shadow">×</button>
                </div>
              ) : currentPhoto ? (
                <div className="relative">
                  <img src={currentPhoto} alt="actual" className="w-20 h-20 object-cover rounded border" />
                  <div className="text-xs text-green-600 mt-1">Foto actual</div>
                </div>
              ) : (
                <div className="w-20 h-20 bg-green-50 flex items-center justify-center rounded border text-green-400">Sin foto</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded border text-green-700 hover:bg-green-50"
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
