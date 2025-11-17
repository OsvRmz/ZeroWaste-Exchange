import client, { handleApiError } from './client';

/**
 * Obtener perfil propio (usa JWT header)
 */
export async function getMe() {
  try {
    const res = await client.get('/api/users/me');
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * Editar perfil.
 * Si incluye photo (File), usa FormData; si no, envía JSON.
 * campo photo en backend espera multipart/form-data (campo 'photo')
 */
export async function updateProfile({ name, city, photoFile }) {
  try {
    if (photoFile) {
      const fd = new FormData();
      if (name !== undefined) fd.append('name', name);
      if (city !== undefined) fd.append('city', city);
      fd.append('photo', photoFile);
      const res = await client.put('/api/users/me', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } else {
      const res = await client.put('/api/users/me', { name, city });
      return res.data;
    }
  } catch (err) {
    handleApiError(err);
  }
}

/** Favoritos del usuario (GET) */
export async function getMyFavorites() {
  try {
    const res = await client.get('/api/users/me/favorites');
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/** Mis publicaciones */
export async function getMyItems() {
  try {
    const res = await client.get('/api/users/me/items');
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/** Estadísticas básicas del usuario */
export async function getMyStats() {
  try {
    const res = await client.get('/api/users/me/stats');
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}
