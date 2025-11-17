// src/components/TransactionEmailModal.jsx
import React from 'react';

function encode(s = '') {
  return encodeURIComponent(s);
}

/**
 * Crea un mailto: listo para abrir el cliente de correo.
 * - to: destinatario (propietario cuando el solicitante envía; solicitante cuando propietario inicia)
 * - subject/body se generan con información de la transacción.
 */
export function createMailTo({ to, fromName, fromEmail, ownerName, ownerEmail, item, message, offeredPrice, proposedItem }) {
  const subject = `[ZeroWaste] Solicitud para "${item?.title || 'artículo'}" (ID: ${item?._id || item?.id || ''})`;
  let body = `${message || ''}\n\n---\nDatos del solicitante:\nNombre: ${fromName || ''}\nEmail: ${fromEmail || ''}\n`;

  if (offeredPrice !== undefined && offeredPrice !== null) {
    body += `Oferta: $ ${Number(offeredPrice).toFixed(2)}\n`;
  }
  if (proposedItem) {
    body += `Propone intercambio por: ${proposedItem.title || proposedItem}\n`;
  }

  body += `\nArtículo: ${item?.title || ''}\nID: ${item?._id || item?.id || ''}\nTipo de transacción: ${item?.transactionType || ''}\n\nPor favor respondan a este correo para coordinar lugar, fecha y detalles.\n\nGracias,\n${fromName || 'Usuario'}\n(Enviado desde ZeroWaste Exchange)\n`;

  const mailto = `mailto:${to}?subject=${encode(subject)}&body=${encode(body)}`;
  return mailto;
}

export default function TransactionEmailModal({ tx, role = 'requester', me, onClose, onMarkCompleted }) {
  // tx: transacción poblada con item, requester, owner, offeredPrice, proposedItem, message, status
  if (!tx) return null;

  const isRequester = role === 'requester';
  const other = isRequester ? tx.owner : tx.requester;
  const myName = me?.name || '';
  const myEmail = me?.email || '';
  const mailTo = createMailTo({
    to: other?.email || '',
    fromName: myName,
    fromEmail: myEmail,
    ownerName: tx.owner?.name,
    ownerEmail: tx.owner?.email,
    item: tx.item,
    message: tx.message,
    offeredPrice: tx.offeredPrice,
    proposedItem: tx.proposedItem
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow max-w-xl w-full p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-green-800">Coordinar y confirmar</h3>
          <button className="text-green-600" onClick={onClose}>Cerrar</button>
        </div>

        <div className="mt-3 text-sm text-green-700 space-y-2">
          <div><strong>Artículo:</strong> {tx.item?.title}</div>
          <div><strong>Tipo:</strong> {tx.item?.transactionType}</div>
          <div><strong>{isRequester ? 'Propietario' : 'Solicitante'}:</strong> {other?.name} — <a className="underline" href={`mailto:${other?.email}`}>{other?.email}</a></div>
          <div className="pt-2">
            <strong>Mensaje original:</strong>
            <div className="mt-1 p-2 bg-green-50 rounded text-sm whitespace-pre-line">{tx.message}</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <a href={mailTo} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Abrir correo para contactar</a>

          <button
            onClick={() => {
              // invocar callback para marcar completada (si el usuario lo desea)
              if (onMarkCompleted) onMarkCompleted(tx._id);
            }}
            className="px-4 py-2 bg-white border border-green-100 text-green-700 rounded hover:bg-green-50"
          >
            Marcar como completada
          </button>

          <button onClick={onClose} className="ml-auto px-3 py-2 text-sm text-green-600">Cerrar</button>
        </div>

        <p className="mt-3 text-xs text-green-500">Después de coordinar por correo, recuerda marcar la solicitud como <strong>completada</strong> para actualizar el estado en la plataforma.</p>
      </div>
    </div>
  );
}
