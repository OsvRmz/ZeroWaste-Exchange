import client, { handleApiError } from './client';

export async function getEnvironmentMetrics() {
  try {
    const res = await client.get('/api/metrics/environment');
    return res.data; // { objectsReused, estimatedKgSaved }
  } catch (err) {
    handleApiError(err);
  }
}
