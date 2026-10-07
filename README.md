# EMI Connect

**EMI Connect: Plataforma web de interacción y comunicación para la comunidad universitaria de la Escuela Militar de Ingeniería (EMI)**

Plataforma privada de red social desarrollada con **Node.js + Express + MongoDB + React + Vite + Tailwind CSS**, preparada para futuras funcionalidades de Inteligencia Artificial.

[![Estado de pruebas backend](https://img.shields.io/badge/pruebas-backend-41%2F41-success?logo=node.js)]()
[![Build frontend](https://img.shields.io/badge/build-frontend-success?logo=vite)]()

## Características principales

- **Autenticación institucional**: solo correo `@est.emi.edu.bo`, verificación de correo, recuperación y restablecimiento de contraseña.
- **Feed de publicaciones**: categorías, reacciones, comentarios anidados, guardados y compartidos.
- **Módulos**: comunidades privadas, eventos, marketplace, mensajería en tiempo real (Socket.IO), notificaciones, perfil completo y admin.
- **Seguridad**: JWT, bcrypt, helmet, CORS restringido, rate limiting, validación de subida de archivos, correo SMTP en modo producción y desarrollo.
- **Respuesta API estandarizada**: `{ exito, mensaje, datos }` / `{ exito: false, mensaje, errores[] }`.
- **Tiempo real**: notificaciones push, estado de usuarios y chat.
- **Preparado para IA**: asistente de recomendaciones y motor de búsqueda destrucción.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express, MongoDB/Mongoose, Socket.IO, JWT, BcryptJS, Nodemailer, Multer, Helmet |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Socket.IO client |
| Testing backend | node --test (41 pruebas) |
| Build frontend | Vite (`npm run construir`) |

## Estructura del proyecto

```
emi-connect/
├── backend/            # API (Node.js + Express + MongoDB + Mongoose + Socket.IO)
│   ├── src/
│   │   ├── aplicaciones/   # Express app + Socket.IO + tiempo real
│   │   ├── config/         # Entorno, BD, correo, datos institucionales
│   │   ├── controladores/  # Solo traducción HTTP -> servicio
│   │   ├── servicios/      # Lógica de negocio (solo repositorios)
│   │   ├── repositorios/   # Acceso a datos (solo consultan)
│   │   ├── rutas/          # Definición de rutas
│   │   ├── modelos/        # Esquemas Mongoose
│   │   ├── middlewares/    # Autenticación, autorización, validación, errores
│   │   ├── validaciones/   # Validaciones express-validator
│   │   ├── pruebas/        # Tests de integración (41/41)
│   │   └── ...
│   ├── scripts/          # crear-admin, sembrarDatos
│   └── uploads/          # Imágenes subidas
├── frontend/           # Interfaz (React + Vite + Tailwind + React Router)
│   ├── src/
│   │   ├── componentes/  # Comunes, contenido, diseño, autenticación
│   │   ├── paginas/      # Autenticación, app principal, administración
│   │   ├── rutas/        # Ruta pública, privada, administrador
│   │   ├── contexto/     # Tema, toast, autenticación, contadores, socket
│   │   ├── servicios/    # Axios + redux-like services
│   │   └── ...
│   ├── vite.config.js, tailwind.config.js, postcss.config.js
│   └── dist/             # Compilación de produccion
└── documentacion/      # Arquitectura, API, base de datos, instalacion, seguridad, funcionalidades
```

## Comenzar rápido

Ver [documentacion/instalacion.md](documentacion/instalacion.md) para la instalación completa.

Resumen:

```bash
# Backend
cd backend && npm install && npm run crear-admin && npm run iniciar

# Frontend
cd frontend && npm install && npm run desarrollo
```

Verificar:

```bash
curl http://localhost:4000/api/salud
curl -I http://localhost:5173/
```

## Scripts

### Backend

| Comando | Descripción |
|---|---|
| `npm run iniciar` | Levantar el servidor en modo produccion |
| `npm run desarrollo` | Modo desarrollo con nodemon |
| `npm run crear-admin` | Crear administrador inicial |
| `npm run sembrar` | Sembrar datos de prueba (5 usuarios con `EmiConnect2026`) |
| `npm run pruebas` | Ejecutar 41 pruebas |

### Frontend

| Comando | Descripción |
|---|---|
| `npm run desarrollo` | Vite dev server en `http://localhost:5173` |
| `npm run construir` | Compilar para produccion (salida `dist/`) |
| `npm run previsualizar` | Preview de la compilacion |

## API

Ver [documentacion/api.md](documentacion/api.md) para la referencia completa.

## Base de datos

MongoDB 8.3 con colecciones en `emi_connect` (desarrollo) y `emi_connect_pruebas` (tests).

Ver [documentacion/base-datos.md](documentacion/base-datos.md).

## Seguridad

Ver [documentacion/seguridad.md](documentacion/seguridad.md).

## Pruebas

```bash
cd backend && npm run pruebas
```

Resultado esperado: `41 passed, 0 failed`.

## Deploy

- Levantar MongoDB 8.3+.
- Configurar `.env` con `MONGODB_URI`, `JWT_SECRETO`, `CORREO_EMISOR`, `CORREO_CONTRASENA`, `DOMINIO_INSTITUCIONAL`.
- Compilar frontend (`npm run construir`) y servir `frontend/dist/` con un proxy inverso al API.
- Usar `npm run iniciar` para el backend.

## Licencia

Proyecto personal para uso educativo/institucional.
