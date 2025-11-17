import client, { handleApiError } from './client';

/**
 * Listar artículos con filtros y paginación
 * params: { q, category, transactionType, sort, page, limit }
 */
export async function getItems(params = {}) {
  try {
    const res = await client.get('/api/items', { params });
    return res.data; // { items, total, page, limit }
  } catch (err) {
    handleApiError(err);
  }
}

/** Obtener detalle de un item */
export async function getItem(itemId) {
  try {
    const res = await client.get(`/api/items/${itemId}`);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * Crear item (con imagen opcional)
 * data: { title, description, category, condition, transactionType, price, location, imageFile }
 */
export async function createItem(data) {
  try {
    const fd = new FormData();
    const fields = ['title','description','category','condition','transactionType','price','location'];
    fields.forEach(f => {
      if (data[f] !== undefined && data[f] !== null) fd.append(f, data[f]);
    });
    if (data.imageFile) fd.append('image', data.imageFile);
    const res = await client.post('/api/items', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * Editar item (dueño)
 * data similar a createItem; imageFile reemplaza la imagen si viene
 */
export async function updateItem(itemId, data) {
  try {
    const fd = new FormData();
    const fields = ['title','description','category','condition','transactionType','price','location'];
    fields.forEach(f => {
      if (data[f] !== undefined && data[f] !== null) fd.append(f, data[f]);
    });
    if (data.imageFile) fd.append('image', data.imageFile);
    // axios + FormData
    const res = await client.put(`/api/items/${itemId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/** Eliminar (marcar inactivo) */
export async function deleteItem(itemId) {
  try {
    const res = await client.delete(`/api/items/${itemId}`);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/** Toggle favorito (POST /api/items/:id/favorite) */
export async function toggleFavorite(itemId) {
  try {
    const res = await client.post(`/api/items/${itemId}/favorite`);
    return res.data; // lista actualizada de favoritos (según backend)
  } catch (err) {
    handleApiError(err);
  }
}
