import React, { useEffect, useState } from 'react';
import { getEnvironmentMetrics } from '../api';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function Impact() {
  const [metrics, setMetrics] = useState({
    objectsReused: 0,
    estimatedKgSaved: 0,
    byCategory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadMetrics() {
    setLoading(true);
    setError(null);
    try {
      const res = await getEnvironmentMetrics();
      setMetrics({
        objectsReused: res.objectsReused ?? 0,
        estimatedKgSaved: res.estimatedKgSaved ?? 0,
        byCategory: res.byCategory ?? []
      });
    } catch (err) {
      setError(err.message || 'Error cargando métricas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-green-800">Impacto ambiental</h1>
        <p className="text-sm text-green-700/80">
          Estimaciones simbólicas basadas en las publicaciones activas de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded shadow p-6">
          <div className="text-sm text-green-700">Objetos marcados como reutilizables</div>
          <div className="text-3xl font-bold text-green-800 mt-2">
            {loading ? '—' : metrics.objectsReused}
          </div>
          <div className="text-xs text-green-600 mt-2">Número de publicaciones activas (posibles objetos que serán reutilizados).</div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="text-sm text-green-700">Kg estimados salvados del vertedero</div>
          <div className="text-3xl font-bold text-green-800 mt-2">
            {loading ? '—' : `${metrics.estimatedKgSaved} kg`}
          </div>
          <div className="text-xs text-green-600 mt-2">Suma aproximada según una estimación por categoría.</div>
        </div>
      </div>

      {/* Gráficas por categoría */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-green-800 mb-4">Distribución por categoría</h2>
        {loading ? (
          <div className="text-sm text-green-600">Cargando gráfica...</div>
        ) : metrics.byCategory.length === 0 ? (
          <div className="text-sm text-green-600">No hay datos para mostrar.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.byCategory} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Objetos" fill="#16a34a" />
              <Bar dataKey="kg" name="Kg estimados" fill="#4ade80" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-green-800 mb-2">Cómo se calcula (breve)</h2>
        <p className="text-sm text-green-700 mb-3">
          Las cifras son <strong>aproximadas</strong> y se obtienen a partir de las publicaciones activas en la plataforma.
          El backend asigna un peso estimado (en kg) por categoría y suma esos valores para obtener la estimación total.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="text-sm text-green-700">
            <strong>Pesos usados (ejemplo):</strong>
            <ul className="list-disc ml-5 mt-2">
              <li>Ropa: 1 kg</li>
              <li>Libros: 1 kg</li>
              <li>Electrónica: 2 kg</li>
              <li>Mueble: 5 kg</li>
              <li>Otros: 1 kg</li>
            </ul>
          </div>

          <div className="text-sm text-green-700">
            <strong>Significado</strong>
            <p className="mt-2">Cada publicación activa se cuenta como “objeto reutilizado” y se multiplica por el peso estimado de su categoría para aproximar los kg salvados.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Actualizar métricas'}
        </button>

        <Link to="/explore" className="px-4 py-2 border rounded text-green-700 hover:bg-green-50">
          Ir a explorar artículos
        </Link>

        <div className="text-sm text-green-600 ml-auto">
          Última actualización: {loading ? '—' : new Date().toLocaleString()}
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
    </div>
  );
}
