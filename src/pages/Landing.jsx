import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';

export default function Landing() {
    return (
        <section className="bg-white/70 backdrop-blur-md rounded-2xl shadow-md p-8 md:p-12">
            <div className="md:flex md:items-center md:gap-8">
                <div className="md:flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
                        Reutiliza, comparte, cuida el planeta
                    </h1>
                    <p className="text-green-700 mb-6">
                        Plataforma educativa para intercambiar, donar o vender (a bajo precio) objetos que ya no usas.
                        Menos residuos, más propósito.
                    </p>

                    <div className="flex gap-3">
                        <Link to="/explore" className="px-5 py-3 rounded-lg bg-green-600 text-white font-medium shadow hover:bg-green-700">
                            Explorar artículos
                        </Link>
                        <Link to="/register" className="px-5 py-3 rounded-lg border border-green-600 text-green-700 hover:bg-green-50">
                            Regístrate
                        </Link>
                    </div>
                </div>

                <div className="md:w-80 md:shrink-0 mt-8 md:mt-0">
                    <div className="rounded-lg overflow-hidden shadow-lg">
                        <img
                            alt="Zero waste"
                            src="/hero-green.jpeg"
                            className="w-full h-48 object-cover"
                        />
                    </div>
                    <p className="text-sm text-green-600 mt-3">
                        <em>Cuidar el planeta empieza por dar nueva vida a lo que ya tenemos</em> <br /> <br />
                        -ZeroWaste Exchange
                    </p>
                </div>
            </div>
        </section>
    );
}
