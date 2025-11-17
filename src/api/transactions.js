// src/api/transactions.js
// Consumer de transacciones / solicitudes entre usuarios
// Usa client y handleApiError definidos en src/api/client
import client, { handleApiError } from './client';

/**
 * Crear una solicitud de transacción para un artículo.
 * body: {
 *   itemId,                // id del artículo (requerido)
 *   message,               // mensaje libre al propietario (requerido)
 *   offeredPrice?,         // número (si es propuesta de compra/negociación)
 *   proposedItemId?,       // id de un item propio (si propones intercambio) - opcional
 *   contactEmail?          // email público si quieres incluir (opcional)
 * }
 *
 * Respuesta esperada: objeto con la solicitud creada
 */
export async function createTransactionRequest(body) {
  try {
    const res = await client.post('/api/transactions', body);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * Obtener lista de solicitudes.
 * params (opcional): { itemId, type, status, direction, page, limit }
 * - itemId: filtrar por artículo
 * - direction: 'incoming'|'outgoing' (incoming = solicitudes recibidas por el usuario dueño)
 * - status: 'pending'|'accepted'|'rejected'|'cancelled'|'completed'
 */
export async function getTransactionRequests(params = {}) {
  try {
    const res = await client.get('/api/transactions', { params });
    return res.data; // { requests: [...], total, page, limit }
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * Obtener una solicitud específica por id
 */
export async function getTransactionRequest(requestId) {
  try {
    const res = await client.get(`/api/transactions/${requestId}`);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * Responder a una solicitud (propietario del artículo).
 * body: { status: 'accepted'|'rejected'|'cancelled'|'completed', note? }
 * - accepted: el propietario acepta; frontend puede mostrar instrucciones para contacto externo
 * - rejected: propietario rechaza
 * - completed: marcar como completada (transacción terminada)
 */
export async function respondToTransactionRequest(requestId, body) {
  try {
    const res = await client.post(`/api/transactions/${requestId}/respond`, body);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * Cancelar una solicitud (quien la creó puede cancelarla)
 */
export async function cancelTransactionRequest(requestId) {
  try {
    const res = await client.post(`/api/transactions/${requestId}/cancel`);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * Marcar una solicitud como completada (puede usarlo el propietario o el solicitante
 * si ambos acuerdan que la transacción se realizó).
 */
export async function completeTransactionRequest(requestId) {
  try {
    const res = await client.post(`/api/transactions/${requestId}/complete`);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * (Helper) Obtener solicitudes entrantes para el usuario actual.
 * equivalente a getTransactionRequests({ direction: 'incoming', ... })
 */
export async function getIncomingRequests(params = {}) {
  try {
    const q = { ...params, direction: 'incoming' };
    const res = await client.get('/api/transactions', { params: q });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

/**
 * (Helper) Obtener solicitudes salientes (las que el usuario creó).
 */
export async function getOutgoingRequests(params = {}) {
  try {
    const q = { ...params, direction: 'outgoing' };
    const res = await client.get('/api/transactions', { params: q });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}
