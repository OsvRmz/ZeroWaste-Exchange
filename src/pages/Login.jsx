import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import { login } from '../api/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      // redirige a la zona principal (ej: explorar)
      navigate('/explore');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="max-w-md mx-auto bg-white/80 rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold text-green-800 mb-4">Iniciar sesión</h2>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-green-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-green-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Link to="/register" className="text-sm text-green-700 hover:underline">¿No tienes cuenta?</Link>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
  );
}
