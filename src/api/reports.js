import client, { handleApiError } from './client';

/**
 * Crear reporte de artículo
 * body: { itemId, reporterEmail, reason }
 */
export async function createReport({ itemId, reporterEmail, reason }) {
  try {
    const res = await client.post('/api/reports', { itemId, reporterEmail, reason });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}
