# API de EMI Connect

## Reglas generales
- Base: `http://localhost:4000/api`
- Todas las respuestas siguen el formato `{ exito, mensaje, datos }` o `{ exito: false, mensaje, errores[] }`.
- Las rutas protegidas requieren `Authorization: Bearer <token>` y `Content-Type: application/json`.
- Las peticiones de subida de imágenes usan `multipart/form-data` y se escriben en `backend/uploads/`.

## Salud y descubrimiento

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| GET | `/salud` | Estado del servicio | No |
| GET | `/` | Descubrimiento: perfil sugerido / comunidades / notificaciones | No |

## Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registro (solo correo institucional `@est.emi.edu.bo`) |
| POST | `/auth/login` | Login, devuelve JWT + usuario |
| POST | `/auth/verify-email` | Validar código de verificación |
| POST | `/auth/forgot-password` | Pedir nueva contraseña (envía código) |
| POST | `/auth/reset-password` | Confirmar nueva contraseña |
| GET | `/auth/verify-token` | Verificar que un token temporal es válido |

## Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/usuarios/perfil` | Perfil actual |
| PUT | `/usuarios/perfil` | Editar perfil |
| PUT | `/usuarios/perfil/contrasena` | Cambiar contraseña |
| PUT | `/usuarios/avatar` | Subir/editar avatar (imagen) |
| PUT | `/usuarios/portada` | Subir/editar portada (imagen) |
| GET | `/usuarios/:id` | Perfil de otro usuario (resumen) |
| GET | `/usuarios/:id/publicaciones` | Publicaciones del usuario |
| GET | `/usuarios/buscar` | Buscar usuarios por nombre, correo o interés |

## Publicaciones

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/publicaciones` | Crear publicación |
| GET | `/publicaciones` | Feed (con paginación y filtros de categoría) |
| GET | `/publicaciones/:id` | Detalle de una publicación |
| PUT | `/publicaciones/:id` | Editar publicación |
| DELETE | `/publicaciones/:id` | Eliminar publicación |
| POST | `/publicaciones/:id/reaccionar` | Añadir reacción |
| DELETE | `/publicaciones/:id/reaccionar` | Quitar reacción |
| GET | `/publicaciones/:id/comentarios` | Comentarios (con paginación) |
| POST | `/publicaciones/:id/comentarios` | Añadir comentario |
| PUT | `/publicaciones/:id/comentarios/:cid` | Editar comentario |
| DELETE | `/publicaciones/:id/comentarios/:cid` | Eliminar comentario |
| POST | `/publicaciones/:id/guardar` | Guardar / quitar de guardados |
| GET | `/publicaciones/guardadas` | Listado de publicaciones guardadas |
| POST | `/publicaciones/:id/compartir` | Compartir publicación |

## Comentarios y reacciones

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/reacciones` | Crear reacción |
| DELETE | `/reacciones/:id` | Eliminar reacción |

## Amistades

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/amistades/solicitar` | Solicitar amistad |
| POST | `/amistades/aceptar` | Aceptar solicitud |
| POST | `/amistades/rechazar` | Rechazar solicitud |
| POST | `/amistades/bloquear` | Bloquear usuario |
| GET | `/amistades` | Amistades del usuario |
| GET | `/amistades/solicitudes` | Solicitudes recibidas |
| GET | `/amistades/enviadas` | Solicitudes enviadas |

## Comunidades

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/comunidades` | Crear comunidad |
| GET | `/comunidades` | Listado (con filtros) |
| GET | `/comunidades/:id` | Detalle |
| PUT | `/comunidades/:id` | Editar comunidad |
| DELETE | `/comunidades/:id` | Eliminar comunidad |
| POST | `/comunidades/:id/invocar` | Invitar a miembros |
| POST | `/comunidades/:id/unirse` | Unirse |
| POST | `/comunidades/:id/salir` | Salir |
| GET | `/comunidades/:id/miembros` | Miembros |
| POST | `/comunidades/:id/solicitudes` | Aceptar/rechazar solicitud de ingreso |
| GET | `/comunidades/:id/eventos` | Eventos de la comunidad |

## Eventos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/eventos` | Crear evento |
| GET | `/eventos` | Listado (con filtros) |
| GET | `/eventos/:id` | Detalle |
| PUT | `/eventos/:id` | Editar evento |
| DELETE | `/eventos/:id` | Eliminar evento |
| POST | `/eventos/:id/asistencia` | Marcar asistencia |
| POST | `/eventos/:id/invitar` | Invitar a miembros de una comunidad |
| GET | `/eventos/participados` | Eventos en los que participó el usuario |

## Mensajería

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/mensajes/conversaciones` | Conversaciones del usuario |
| GET | `/mensajes/conversaciones/:id` | Mensajes de una conversación |
| POST | `/mensajes/conversaciones` | Crear conversación |
| GET | `/mensajes/conversaciones/:id/participantes` | Participantes |
| POST | `/mensajes` | Enviar mensaje |
| POST | `/mensajes/:id/leido` | Marcar legible |
| GET | `/mensajes/contador` | Contador de mensajes no leídos |

## Marketplace

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/productos` | Publicar anuncio |
| GET | `/productos` | Listado (con filtros y paginación) |
| GET | `/productos/:id` | Detalle |
| PUT | `/productos/:id` | Editar anuncio |
| DELETE | `/productos/:id` | Eliminar anuncio |
| PUT | `/productos/:id/estado` | Cambiar estado (disponible/reservado/vendido/pausado) |
| GET | `/productos/contactar` | Contactar al vendedor |

## Notificaciones

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/notificaciones` | Listado |
| PUT | `/notificaciones/:id/leer` | Marcar como leída |
| PUT | `/notificaciones/mark-all-as-read` | Marcar todas como leídas |
| DELETE | `/notificaciones/:id` | Eliminar |
| GET | `/notificaciones/no-leidas/cantidad` | Cantidad no leídas |

## Reportes

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/reportes` | Crear reporte |
| GET | `/reportes` | Listado (admin) |
| GET | `/reportes/:id` | Detalle |
| PUT | `/reportes/:id` | Resolver reporte |
| GET | `/reportes/:id/motivo` | Motivos disponibles |

## Administración

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/resumen` | Resumen general |
| GET | `/admin/usuarios` | Listado de usuarios |
| GET | `/admin/publicaciones` | Publicaciones del sistema |
| GET | `/admin/comunidades` | Comunidades |
| GET | `/admin/estadisticas` | Estadísticas y gráficas |
| GET | `/admin/reportes` | Reportes y moderación |
