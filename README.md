## ZeroWaste Exchange

ZeroWaste Exchange es una aplicación web tipo marketplace educativo donde los usuarios pueden publicar, explorar e intercambiar artículos mediante anuncios clasificados.
El sistema incluye un backend en Node.js/Express con MongoDB y un frontend en React (Vite).

## Características principales

- Exploración de artículos
- Búsqueda por texto flexible mediante el parámetro q.
- Filtros por categoría (category) y tipo de transacción (transactionType).
- Paginación mediante page y limit.
- Ordenamiento por fecha de creación (sort=newest o sort=oldest).
- Por defecto, solo se muestran artículos activos (active = true).
- Publicaciones activas e inactivas
- Los dueños pueden activar o desactivar sus artículos.
- El dashboard del usuario permite obtener artículos propios, incluyendo inactivos
- El backend valida el acceso para asegurar que solo el dueño pueda ver sus artículos inactivos.
- Sistema de usuarios
- Cada publicación pertenece a un usuario registrado.
- La información visible del dueño del artículo incluye: nombre, ciudad, correo y foto.
- CRUD de artículos
- Crear artículos
- Editar artículos
- Activar/desactivar artículos
- Consultar artículos propios y públicos

## Tecnologías utilizadas

**Frontend**

- React con Vite
- React Router
- Axios
- TailwindCSS 
- Context API / Hooks

**Backend**

- Node.js con Express
- MongoDB y Mongoose
- Control de autenticación (JWT)