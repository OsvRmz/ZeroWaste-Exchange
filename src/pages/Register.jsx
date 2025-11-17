import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cities = [
    'Monterrey',
    'San Nicolás de los Garza',
    'Guadalupe',
    'Apodaca',
    'Santa Catarina',
    'General Escobedo',
    'Juarez',
    'San Pedro Garza García'
  ];

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password || !form.confirmPassword || !form.city) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        city: form.city
      });
      navigate('/explore'); // redirigir al marketplace tras registro
    } catch (err) {
      setError(err?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-4 text-green-800">Crear cuenta</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Nombre completo"
          value={form.name}
          onChange={handleChange}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirma tu contraseña"
          value={form.confirmPassword}
          onChange={handleChange}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
        />

        {/* Select de ciudad */}
        <select
          name="city"
          value={form.city}
          onChange={handleChange}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          <option value="">Selecciona tu ciudad</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>
      <p className="mt-4 text-sm text-green-700">
        ¿Ya tienes cuenta? <Link to="/login" className="underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
