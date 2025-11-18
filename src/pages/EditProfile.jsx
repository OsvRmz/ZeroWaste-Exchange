import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, updateProfile } from "../api";

const CITIES = [
  "Monterrey",
  "San Nicolás de los Garza",
  "Guadalupe",
  "Apodaca",
  "Santa Catarina",
  "General Escobedo",
  "Juarez",
  "San Pedro Garza García",
];

export default function EditProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const me = await getMe();
        if (!mounted) return;
        setName(me.name || "");
        setCity(me.city || "");
        setEmail(me.email || "");
        setCurrentPhoto(me.photo || null);
      } catch (err) {
        setError("Error cargando perfil");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setPhotoFile(f);
  };

  const removeSelectedPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) return setError("El nombre es obligatorio.");

    setSaving(true);
    try {
      const payload = { name: name.trim(), city: city.trim() };
      if (photoFile) payload.photoFile = photoFile;

      const updated = await updateProfile(payload);

      setName(updated.name || name);
      setCity(updated.city || city);
      setCurrentPhoto(updated.photo || currentPhoto);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess("Perfil actualizado correctamente.");

      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      setError("Error guardando cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse p-6 bg-white rounded shadow">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-green-800">Editar perfil</h1>
        <p className="text-sm text-green-700/80">
          Actualiza tu nombre, ciudad o foto. El email no puede editarse.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl shadow p-6 space-y-6 border border-green-100"
      >
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
            {success}
          </div>
        )}

        {/* Nombre */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-green-800">Nombre *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
            required
          />
        </div>

        {/* Ciudad (cambiado a select) */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-green-800">Ciudad</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <option value="">Seleccionar ciudad</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Email no editable */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-green-800">
            Email (no editable)
          </label>
          <div className="px-3 py-2 border rounded-lg bg-green-50 text-green-800">
            {email}
          </div>
        </div>

        {/* Foto de perfil */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-green-800">Foto de perfil</label>

          <div className="flex items-center gap-6">
            {/* Botón personalizado */}
            <label className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow">
              Subir foto
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </label>

            {/* Preview */}
            <div>
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="preview"
                    className="w-24 h-24 object-cover rounded-lg border shadow"
                  />
                  <button
                    type="button"
                    onClick={removeSelectedPhoto}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-600 shadow-lg border"
                  >
                    ×
                  </button>
                </div>
              ) : currentPhoto ? (
                <div className="relative">
                  <img
                    src={currentPhoto}
                    alt="actual"
                    className="w-24 h-24 object-cover rounded-lg border shadow"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-green-50 flex items-center justify-center rounded-lg border text-green-400">
                  Sin foto
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg border text-green-700 hover:bg-green-50"
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 shadow"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}