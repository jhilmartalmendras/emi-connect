# Arquitectura de EMI Connect (Backend)

## Resumen
EMI Connect es una red social universitaria privada para la comunidad EMI (Escuela Militar de Ingeniería). El backend está desarrollado con **Node.js + Express + MongoDB (Mongoose) + Socket.IO** y sigue una arquitectura **por capas** (rutas → controladores → servicios → repositorios → modelos) para mantener el código modular, mantenible y escalable.

## Stack tecnológico
- **Node.js** (v24.15.0)
- **Express** (v4.21.1) — servidor HTTP y enrutador de APIs
- **MongoDB** (v8.3) + **Mongoose** (v8.8.0) — base de datos y ODM
- **Socket.IO** (v4.8.1) — mensajería en tiempo real
- **JSON Web Token** (jsonwebtoken v9) — autenticación
- **Bcrypt.js** (v2.4.3) — hashing de contraseñas
- **Nodemailer** — envío de correos de verificación y recuperación
- **Multer** — subida de archivos (imágenes)
- **Helmet, CORS, Morgan, Express-rate-limit** — seguridad y observabilidad

## Estructura del proyecto (backend)

```
backend/
├── src/
│   ├── aplicaciones/       # Express app + Socket.IO (no HTTP directo)
│   │   ├── aplicacion.js   # Crea y configura la aplicación Express
│   │   ├── sockets.js      # Configura el namespace de Socket.IO
│   │   └── tiempoReal.js   # Registro de conexiones y estado en vivo
│   ├── config/             # Configuración central (entorno, BD, correo, institucional)
│   ├── constantes/         # Roles, catalogos y constantes globales
│   ├── controladores/      # Solo traducción HTTP → servicio
│   ├── middlewares/        # Autenticación, autorización, validación, subida, errores
│   ├── modelos/            # Esquemas Mongoose
│   ├── repositorios/       # Acceso a datos (NO usa Mongoose directamente en servicios)
│   ├── rutas/              # Definición de rutas y middleware de ruta
│   ├── servicios/          # Lógica de negocio (consulta solo repositorios)
│   ├── utilidades/         # Helpers y clases de dominio (ErrorAplicacion, respuesta, token)
│   ├── validaciones/       # Validaciones express-validator por recurso
│   └── pruebas/            # Tests de integración (node --test)
├── scripts/                # Scripts de línea de comandos (crearAdministrador, sembrarDatos)
├── uploads/                # Archivos subidos (perfiles, publicaciones, comunidades, eventos, productos)
├── .env                    # Variables de entorno (no versionar)
└── package.json
```

## Flujo de una petición HTTP

1. **Ruta** (`src/rutas/*.js`) — define la URL, el método y enlaza controlador + validaciones.
2. **Controlador** (`src/controladores/*.js`) — extrae `req`/`res`, llama al servicio y devuelve la respuesta estándar.
3. **Servicio** (`src/servicios/*.js`) — lógica de negocio; **NO usa Mongoose directamente**, solo repositorios.
4. **Repositorio** (`src/repositorios/*.js`) — consulta/escritura a Mongoose.
5. **Modelo** (`src/modelos/*.js`) — esquema y validación de datos.

Las respuestas API siguen el formato unificado:

```json
// Éxito
{ "exito": true, "mensaje": "Operacion realizada correctamente", "datos": { ... } }

// Error
{ "exito": false, "mensaje": "No se pudo completar la operacion", "errores": [ "mensaje de error" ] }
```

## Seguridad implementada
- Helmet (CSP, HSTS, X-Content-Type-Options)
- CORS restringido a `localhost:5173` y el `FRONTEND_URL` configurado
- Rate limiting global en `/api`
- JWT con expiración y verificación de sesión en cada petición protegida
- `express-rate-limit` para proteger endpoints de autenticación
- Adjuntos de archivo solo imágenes permitidas, tamaño máximo configurable
- BcryptJS con coste de hashing configurable

## Tiempo real (Socket.IO)
El servidor de sockets gestiona notificaciones push, mensajería privada y estado de los usuarios. Los sockets se autentican con el mismo JWT que la API. El motor de reacciones, comentarios y publicaciones también suena notificaciones en vivo.

## Pruebas

```bash
cd backend
npm run pruebas        # 41 pruebas: autenticacion, permisos, publicaciones
```

Los tests usan `node --test "src/pruebas/*.test.js"` (con las comillas, para que funcionen en Windows).
