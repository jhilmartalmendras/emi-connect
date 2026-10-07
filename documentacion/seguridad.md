# Seguridad en EMI Connect

## Principios
- La plataforma maneja datos institucionales sensibles. Todo acceso está autenticado y autorizado.
- Credenciales y variables de entorno **nunca** deben commitearse. El `.gitignore` excluye `.env`.
- El backend sigue el diseño de capas y las respuestas estandarizadas para aislar errores.

## Medidas implementadas

### Autenticación
- JWT en `Authorization: Bearer <token>` para todas las rutas protegidas.
- Verificación de sesión, expiración y estado del usuario en cada petición.
- Tokens de verificación de correo y de recuperación de contraseña, con expiración y uso único.

### Contraseñas
- Hashing con `bcryptjs` y coste configurble.
- Reglas de complejidad aplicadas en validación (`min 8 caracteres`, etc.).

### Autorización
- Por rol: `estudiante`, `docente`, `administrativo`, `moderador`, `administrador`.
- Panel `/administracion` restringido a `moderador` y `administrador`.
- Métodos CRUD y permisos de "solo autor" para publicaciones, comentarios, reacciones y productos.
- Verificación de pertenencia a comunidades y eventos antes de acciones sensibles.

### Entrada y salida
- `helmet` para encabezados de seguridad (CSP, HSTS, X-Content-Type-Options).
- CORS solo a `localhost:5173` y al `FRONTEND_URL` configurado.
- Rate limiting global en `/api` y de forma específica en endpoints de autenticación.
- Validación con `express-validator` en todas las rutas que reciben cuerpos.
- Subida de archivos solo imágenes permitidas (`jpg`, `jpeg`, `png`, `webp`), tamaño máximo configurable, con denegación de dotfiles y `index:false`.

### Correo
- Transporte configurado con credenciales en `.env`, nunca en el código.
- En desarrollo, `CORREO_MODO_DESARROLLO` hace que los códigos se muestren por consola y no se envíen SMTP reales.
- El sistema maneja fallos de SMTP sin dejar caer la petición (retorna `{enviado: false, error}`).

### Observabilidad
- Morgan registra todas las peticiones en desarrollo.
- Errores inesperados se capturan con `unhandledRejection` y `uncaughtException` para no dejar el proceso en estado indeterminado.

## Recomendaciones de operacion
- Cambiar `JWT_SECRETO` y `CORREO_CONTRASENA` en producción.
- Mantener MongoDB respaldado.
- No exponer `http://localhost:4000` a Internet directamente; usar un reverse proxy (nginx) en producción.
- Revisar `backend/servidor.log` y `backend/proceso.log` para detectar errores o picos de tráfico.
