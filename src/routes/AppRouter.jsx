import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout';
import PrivateLayout from '../layouts/PrivateLayout';
import PrivateRoute from './PrivateRoute'; 

// Páginas públicas
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Páginas internas / privadas
import Explore from '../pages/Explore';
import ArticleDetail from '../pages/ArticleDetail';
import CreateArticle from '../pages/CreateArticle';
import EditArticle from '../pages/EditArticle';
import Dashboard from '../pages/Dashboard';
import EditProfile from '../pages/EditProfile';
import Impact from '../pages/Impact';
import About from '../pages/About';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rutas públicas */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Rutas privadas protegidas */}
        <Route element={
          <PrivateRoute>
            <PrivateLayout />
          </PrivateRoute>
        }>
          {/* Marketplace */}
          <Route path="/explore" element={<Explore />} />
          <Route path="/items/:id" element={<ArticleDetail />} />

          {/* Crear / Editar publicación */}
          <Route path="/items/create" element={<CreateArticle />} />
          <Route path="/items/:id/edit" element={<EditArticle />} />

          {/* Dashboard / Perfil */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/edit" element={<EditProfile />} />

          {/* Métricas ambientales y acerca del proyecto */}
          <Route path="/metrics" element={<Impact />} />
          <Route path="/about" element={<About />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
