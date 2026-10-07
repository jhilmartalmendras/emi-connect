# Funcionalidades de EMI Connect

EMI Connect es una red social universitaria privada para la Escuela Militar de Ingeniería (EMI).
Sigue un modelo inspirado en redes sociales modernas, pero con identidad propia orientada al
ambiente universitario y militar/academico.

## Módulo Autenticación
- Registro con correo institucional `@est.emi.edu.bo` únicamente.
- Verificación de correo con código de seguridad.
- Recuperación de contraseña (dos pasos): solicitar código → confirmar nueva contraseña.
- Restablecimiento de contraseña con token temporal.
- Perfil visible/editable, control de estado de conexión.

## Módulo Publicaciones
- Crear publicación con texto, hasta 4 imágenes adjuntas, categoría y privacidad.
- Feed con filtros por categoría (`general`, `academica`, `institucional`, `evento`, `venta`, `pregunta`, `logro`).
- Reacciones múltiples por usuario y publicación.
- Comentarios con anidamiento de respuestas.
- Guardado / quitar de guardados.
- Compartir publicación.
- Reportar publicación, comentario, usuario o producto.

## Módulo Comunidades
- Crear comunidades privadas y públicas.
- Miembros con roles (administrador, moderador, miembro).
- Solicitudes de ingreso solo para comunidades privadas (aceptadas/rechazadas por admin).
- Invitaciones y salida.

## Módulo Eventos
- Crear eventos con fecha, hora, lugar e imágenes.
- Asistencia (`interesado`, `asistire`, `no_asistire`).
- Organización y calendario.
- Ver detalle y eventos participados.

## Módulo Marketplace
- Publicar anuncio de productos (libros, electrónica, computadoras, etc.).
- Estados del producto: `disponible`, `reservado`, `vendido`, `pausado`.
- Contactar a un vendedor (abre una conversación).

## Módulo Mensajería
- Chat en tiempo real con Socket.IO.
- Envío de texto e imágenes.
- Indicador de "escribiendo...".
- Marcar mensajes como leídos.
- Contador de mensajes no leídos.

## Módulo Notificaciones
- Notificaciones en tiempo real (reacción, comentario, solicitud de amistad, mensaje, evento, comunidad, reporte).
- Marcar como leída individualmente o todas a la vez.

## Módulo Perfil
- Portada y avatar.
- Foto de perfil con edición.
- Publicaciones del perfil.
- Acciones de amistad (solicitar, aceptar, rechazar, bloquear).

## Módulo Administración
- Panel para `moderador` y `administrador`.
- Resumen general, estadísticas (con gráficas en divs nativos), usuarios, publicaciones, comunidades y reportes.
- Resolución de reportes con modal.

## Módulo Buscador
- Búsqueda global de usuarios, publicaciones y contenido.

## Estado de la sesión
- El estado se mantiene en el navegador; al cerrar sesión se eliminan token, usuario y contadores.
- El frontend valida la expiración del token y redirige adecuadamente.
