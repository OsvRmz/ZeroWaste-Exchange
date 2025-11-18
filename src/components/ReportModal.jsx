import React, { useState } from 'react';
import { createReport } from '../api';

/**
 * ReportModal
 *
 * Props:
 * - itemId: id del artículo
 * - initialEmail: email por defecto (puede venir del usuario logueado)
 * - onClose: función para cerrar el modal
 * - onSuccess: función opcional que se llama cuando el reporte se envía correctamente
 */
export default function ReportModal({ itemId, initialEmail = '', onClose, onSuccess }) {
  const REASONS = [
    'Precio desproporcionado',
    'Contenido inapropiado',
    'Artículo no corresponde a la categoría',
    'Posible estafa / fraude',
    'Información falsa',
    'Otro'
  ];

  const [email, setEmail] = useState(initialEmail || '');
  const [reasonType, setReasonType] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleSubmit(e) {
    e?.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Por favor ingresa un correo para seguimiento.');
      return;
    }

    if (!reasonType) {
      setError('Selecciona un motivo para el reporte.');
      return;
    }

    setLoading(true);
    try {
      // Backend: algunos endpoints esperan { itemId, reporterEmail, reason } como string.
      // Componemos una cadena con tipo y descripción para asegurar compatibilidad.
      const reasonPayload = `${reasonType}${description ? ': ' + description.trim() : ''}`;

      await createReport({
        itemId,
        reporterEmail: email.trim(),
        reason: reasonPayload
      });

      const msg = 'Reporte enviado. Gracias por ayudar a mantener la comunidad.';
      setSuccessMsg(msg);
      if (typeof onSuccess === 'function') onSuccess(msg);

      // no cerramos automáticamente — dejamos al usuario cerrar o lo hace el padre si quiere
    } catch (err) {
      setError(err?.message || 'Error enviando el reporte');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-800">Reportar publicación</h3>
          <button onClick={onClose} className="text-green-600">Cerrar</button>
        </div>

        {successMsg ? (
          <div className="p-3 bg-green-50 text-green-700 rounded">
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-green-700">Tu correo (para seguimiento)</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                type="email"
                placeholder="tu@correo.com"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>

            <div>
              <label className="text-sm text-green-700">Motivo</label>
              <select
                value={reasonType}
                onChange={e => setReasonType(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-green-700">Descripción (opcional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Añade más detalles que ayuden a revisar el reporte (ej. enlace, observaciones...)"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex items-center gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                {loading ? 'Enviando...' : 'Enviar reporte'}
              </button>
              <button type="button" onClick={onClose} className="px-3 py-2 rounded border text-green-700">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
