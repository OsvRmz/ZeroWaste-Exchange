import axios from 'axios';

const API_URL = 'http://localhost:3000';
const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Permite establecer/eliminar el header Authorization
export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete client.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
}

// Si al cargar la app ya hay un token en localStorage, lo colocamos
const savedToken = localStorage.getItem('token');
if (savedToken) setAuthToken(savedToken);

// Interceptor de respuestas para manejar 403
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      // Token expirado o acceso prohibido
      setAuthToken(null); // limpia token
      window.location.href = '/login?expired=true'; // redirige al login
      return Promise.reject(new Error('Sesión expirada, por favor ingresa de nuevo.'));
    }
    return Promise.reject(error);
  }
);

// helper para normalizar errores (lanzamos para que el componente maneje)
export function handleApiError(error) {
  // mostramos message del backend si existe
  const msg = error?.response?.data?.message || error.message || 'Error de conexión';
  const e = new Error(msg);
  e.status = error?.response?.status;
  throw e;
}

export default client;
