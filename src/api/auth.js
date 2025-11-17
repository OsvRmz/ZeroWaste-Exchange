import client, { setAuthToken, handleApiError } from './client';

export async function register({ name, email, password, city, photo }) {
  try {
    const res = await client.post('/api/auth/register', { name, email, password, city, photo });
    if (res.data?.token) setAuthToken(res.data.token);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

export async function login({ email, password }) {
  try {
    const res = await client.post('/api/auth/login', { email, password });
    if (res.data?.token) setAuthToken(res.data.token);
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}

export function logout() {
  // solo limpiar token local (front)
  setAuthToken(null);
}
