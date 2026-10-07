# EMI Connect — Backend

API de la plataforma **EMI Connect**, desarrollada con Node.js + Express + MongoDB + Mongoose + Socket.IO.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run iniciar` | Levantar el servidor (modo producción) |
| `npm run desarrollo` | Modo desarrollo con nodemon |
| `npm run crear-admin` | Crear administrador inicial (pide datos o usa `ADMIN_NOMBRES`, `ADMIN_APELLIDOS`, `ADMIN_CORREO`, `ADMIN_CONTRASENA`) |
| `npm run sembra` | Sembrar datos de prueba (5 usuarios con contraseña `EmiConnect2026`) |
| `npm run pruebas` | Ejecutar 41 pruebas de integración |

## Estructura

```
src/
├── aplicaciones/       # aplicacion.js, sockets.js, tiempoReal.js
├── config/             # baseDatos.js, institucional.js, variablesEntorno.js
├── controladores/      # Autenticacion, Usuarios, Publicaciones, Comentarios, ...
├── middlewares/        # autenticacion, autorizacion, validacion, errores, subidaArchivos
├── modelos/            # Usuario, Publicacion, Comentario, Amistad, Comunidad, Evento, ..., Reporte
├── repositorios/       # Usuario, Publicacion, Comentario, Amistad, Comunidad, ...
├── rutas/              # index.js, autenticacion, usuarios, publicaciones, administracion...
├── servicios/          # Autenticacion, Publicacion, Comentario, Asistencia, Recomendacion...
├── utilidades/         # respuesta.js, tokenJwt.js, ErrorAplicacion.js, paginacion.js
└── pruebas/            # 41 tests (autenticacion, permisos, publicaciones)
```

## Entorno

Ver [documentacion/instalacion.md](documentacion/instalacion.md) para la configuración completa.

## Pruebas

```bash
npm run pruebas
```

## Correo

- Modo desarrollo (`CORREO_MODO_DESARROLLO=true` o sin `CORREO_CONTRASENA`): los códigos se imprimen en `backend/servidor.log`.
- Producción: `CORREO_EMISOR` y `CORREO_CONTRASENA` se configuran en `.env`.
