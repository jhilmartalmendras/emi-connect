const { Router } = require('express');
const { rutasAutenticacion } = require('./rutasAutenticacion');
const { rutasUsuarios } = require('./rutasUsuarios');
const { rutasPublicaciones } = require('./rutasPublicaciones');
const { rutasComentarios, rutasReacciones } = require('./rutasInteracciones');
const { rutasAmistades } = require('./rutasAmistades');
const { rutasComunidades } = require('./rutasComunidades');
const { rutasEventos } = require('./rutasEventos');
const { rutasMensajes } = require('./rutasMensajes');
const { rutasNotificaciones } = require('./rutasNotificaciones');
const { rutasProductos } = require('./rutasProductos');
const { rutasReportes } = require('./rutasReportes');
const { rutasAdmin } = require('./rutasAdmin');
const { rutasDescubrimiento } = require('./rutasDescubrimiento');

const enrutador = Router();

// Todas las rutas se montan bajo /api desde la aplicacion principal.
enrutador.use('/auth', rutasAutenticacion);
enrutador.use('/usuarios', rutasUsuarios);
enrutador.use('/publicaciones', rutasPublicaciones);
enrutador.use('/comentarios', rutasComentarios);
enrutador.use('/reacciones', rutasReacciones);
enrutador.use('/amistades', rutasAmistades);
enrutador.use('/comunidades', rutasComunidades);
enrutador.use('/eventos', rutasEventos);
enrutador.use('/mensajes', rutasMensajes);
enrutador.use('/notificaciones', rutasNotificaciones);
enrutador.use('/productos', rutasProductos);
enrutador.use('/reportes', rutasReportes);
enrutador.use('/admin', rutasAdmin);

// Descubrimiento: busqueda, recomendaciones y asistente
enrutador.use('/', rutasDescubrimiento);

module.exports = { rutasApi: enrutador };
