import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-green-800">Acerca del Proyecto</h1>
        <p className="text-green-700/80 mt-2">
          Este proyecto busca educar sobre la reutilización de objetos y reducir la generación de residuos mediante el intercambio, la donación y la venta responsable.
        </p>
      </header>

      <section className="bg-white rounded shadow p-6 space-y-4">
        <h2 className="text-xl font-medium text-green-800">Nuestra iniciativa Zero Waste</h2>
        <p className="text-green-700 text-sm">
          Zero Waste Exchange es una plataforma gratuita que permite a los usuarios compartir artículos que ya no usan, fomentando la economía circular y la reutilización. La idea es generar conciencia ambiental mientras se practican hábitos sostenibles de consumo.
        </p>
      </section>

      <section className="bg-white rounded shadow p-6 space-y-4">
        <h2 className="text-xl font-medium text-green-800">Motivación ambiental</h2>
        <p className="text-green-700 text-sm">
          Cada objeto reutilizado evita que termine en un vertedero y reduce la necesidad de producir uno nuevo. La plataforma proporciona métricas aproximadas de impacto ambiental, mostrando el número de objetos reutilizados y los kilogramos estimados de basura que se han evitado.
        </p>
      </section>

      <section className="bg-white rounded shadow p-6 space-y-4">
        <h2 className="text-xl font-medium text-green-800">Créditos del equipo</h2>
        <ul className="list-disc ml-5 text-green-700 text-sm">
          <li>Desarrollo: [Emilio Osvaldo Ramirez Morales]</li>
          <li>Diseño UI/UX: [Castillo Gonzalez Fernando Alfonso, Castro Monroy Eduardo David]</li>
          <li>Documentación y pruebas: [Emilio Osvaldo Ramirez Morales, Polo Cruz David Alejandro]</li>
          <li>Proyecto educativo supervisado por: [Emilio Osvaldo Ramirez Morales]</li>
        </ul>
      </section>

      <div className="flex justify-start mt-6">
        <Link
          to="/explore"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Ir a explorar artículos
        </Link>
      </div>
    </div>
  );
}
