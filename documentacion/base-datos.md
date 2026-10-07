# Modelo de datos de EMI Connect

Base de datos: **MongoDB 8.3** → colección `emi_connect` (desarrollo) / `emi_connect_pruebas` (tests).

## Colecciones principales

### `usuarios`
```
_id, nombres, apellidos, correo (unico), contrasena (hash), rol, avatar, portada,
universidad, carrera, semestre, intereses[], verificado, activo, bloqueado,
facebook, twitter, instagram, linkedin, ubicacion, biografia, fechaCreacion, fechaActualizacion
```

### `publicaciones`
```
_id, autor (usuario), comunidad (opcional), texto, imagenes[], categoria,
reacciones[], comentarios[], guardadas[], compartidos, privacidad, fechaCreacion, fechaActualizacion
```

### `comentarios`
```
_id, autor, publicacion, texto, padres[], respuestaA, fechaCreacion, fechaActualizacion
```

### `reacciones`
```
_id, usuario, publicacion, tipo, fechaCreacion
```

### `amistades`
```
_id, usuarioOrigen, usuarioDestino, estado (pendiente|aceptada|rechazada|cancelada|bloqueada),
mensajesUnidos, fechaSolicitud, fechaRespuesta, fechaBloqueo
```

### `comunidades`
```
_id, nombre, descripcion, portada, categoria, privada, miembros, estado (activa|inactiva|baCelada),
fechaCreacion, administradores, moderadores, solicitudes, notificaciones, reglas
```

### `miembrosComunidad`
```
_id, comunidad, usuario, rol (administrador|moderador|miembro), fechaIngreso, fechaSalida, solicitud
```

### `eventos`
```
_id, titulo, descripcion, fecha, hora, lugar, imagenes[], comunidad, organizer, asistentes, estado,
fechaCreacion, fechaActualizacion
```

### `asistenciaEvento`
```
_id, evento, usuario, estado (interesado|asistire|no_asistire), fechaRespuesta
```

### `productos`
```
_id, nombre, descripcion, precio, moneda, estado (disponible|reservado|vendido|pausado),
imagenes[], vendedor, contacto, fechaPublicacion, fechaActualizacion
```

### `mensajes` / `conversaciones`
```
mensajes: _id, deUsuario, paraUsuario, contenido, imagenes[], enviadoEn, leidoEn
conversaciones: _id, participantes[], ultimoMensaje, contadorNoLeidos, fechaActualizacion
```

### `notificaciones`
```
_id, usuario, tipo, titulo, cuerpo, leida, fechaCreacion
```

### `reportes`
```
_id, autor, tipo (publicacion|comentario|usuario|producto|comunidad), objetivoId, motivo,
descripcion, estado (pendiente|en_revision|resuelto|rechazado), fechaCreacion
```

### `reportes` — también se entregan los motivos (`MOTIVOS_REPORTE`) y estados.

### `publicacionGuardadas`
```
_id, usuario, publicacion, fechaGuardado
```

### `bloqueos`, `historias`, `configuracionPrivacidad`, `tokenVerificacion`
- `bloqueos`: usuario bloqueado y fecha.
- `historias`: historia del usuario.
- `configuracionPrivacidad`: niveles de privacidad del usuario.
- `tokenVerificacion`: tokens de verificación y recuperación (expiración).

## Relaciones clave
- Un `usuario` pertenece a muchas `publicaciones`, `comentarios`, `reacciones`, `amistades`, `mensajes`, `productos`, `notificaciones` y `reportes`.
- Una `publicacion` pertenece a un `autor` y opcionalmente a una `comunidad`.
- Un `comentario` pertenece a un `autor` y a una `publicacion`, con anidamiento de `padres[]`.
- Una `comunidad` tiene muchos `miembrosComunidad`.
- Un `evento` puede pertenecer a una `comunidad` y tener muchos `asistenciaEvento`.
- Una `conversacion` relaciona dos `usuarios` y almacena `mensajes`.
