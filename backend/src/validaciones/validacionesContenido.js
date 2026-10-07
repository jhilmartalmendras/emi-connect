const { body, query } = require('express-validator');
const {
  CATEGORIAS_PUBLICACION,
  TIPOS_REACCION,
  CATEGORIAS_PRODUCTO,
  ESTADOS_PRODUCTO,
  ESTADOS_REPORTE,
  TIPOS_REPORTE,
  MOTIVOS_REPORTE,
  ESTADOS_ASISTENCIA,
} = require('./validacionesComunes');

// ---------------------------------------------------------------- Publicaciones
const validarCrearPublicacion = [
  body('contenido')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('El contenido de la publicacion no debe superar los 5000 caracteres.'),
  body('categoria').optional().isIn(CATEGORIAS_PUBLICACION).withMessage('La categoria no es valida.'),
  body('imagenes').optional().isArray({ max: 10 }).withMessage('Se permiten hasta 10 imagenes por publicacion.'),
  body('etiquetas').optional().isArray({ max: 10 }).withMessage('Se permiten hasta 10 etiquetas.'),
  body('comunidad').optional({ nullable: true }).isMongoId().withMessage('La comunidad no es valida.'),
  body('evento').optional({ nullable: true }).isMongoId().withMessage('El evento no es valido.'),
  body('producto').optional({ nullable: true }).isMongoId().withMessage('El producto no es valido.'),
  body('enlace.url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL({ require_protocol: true })
    .withMessage('El enlace debe comenzar con http:// o https://.'),
];

const validarActualizarPublicacion = [
  body('contenido')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('El contenido no debe superar los 5000 caracteres.'),
  body('categoria').optional().isIn(CATEGORIAS_PUBLICACION).withMessage('La categoria no es valida.'),
  body('imagenes').optional().isArray({ max: 10 }).withMessage('Se permiten hasta 10 imagenes.'),
  body('etiquetas').optional().isArray({ max: 10 }).withMessage('Se permiten hasta 10 etiquetas.'),
];

const validarCompartir = [
  body('comentario')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('El comentario al compartir no debe superar los 1000 caracteres.'),
];

// ---------------------------------------------------------------- Comentarios
const validarCrearComentario = [
  body('contenido')
    .trim()
    .notEmpty()
    .withMessage('El comentario no puede estar vacio.')
    .isLength({ min: 1, max: 1500 })
    .withMessage('El comentario debe tener entre 1 y 1500 caracteres.'),
  body('comentarioPadreId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('El comentario padre no es valido.'),
];

const validarActualizarComentario = [
  body('contenido')
    .trim()
    .notEmpty()
    .withMessage('El comentario no puede estar vacio.')
    .isLength({ max: 1500 })
    .withMessage('El comentario no debe superar los 1500 caracteres.'),
];

// ---------------------------------------------------------------- Reacciones
const validarReaccion = [
  body('objetivoId').isMongoId().withMessage('El contenido a reaccionar no es valido.'),
  body('objetivoModelo')
    .optional()
    .isIn(['Publicacion', 'Comentario'])
    .withMessage('El tipo de contenido no es valido.'),
  body('tipo').isIn(TIPOS_REACCION).withMessage('El tipo de reaccion no es valido.'),
];

// ---------------------------------------------------------------- Comunidades
const validarCrearComunidad = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la comunidad es obligatorio.')
    .isLength({ min: 3, max: 120 })
    .withMessage('El nombre debe tener entre 3 y 120 caracteres.'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 800 })
    .withMessage('La descripcion no debe superar los 800 caracteres.'),
  body('categoria').optional().trim().isLength({ max: 60 }).withMessage('La categoria es demasiado larga.'),
  body('reglas').optional().isArray({ max: 15 }).withMessage('Se permiten hasta 15 reglas.'),
  body('esPrivada').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
];

const validarActualizarComunidad = [
  body('nombre').optional().trim().isLength({ min: 3, max: 120 }).withMessage('Nombre invalido.'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 800 })
    .withMessage('La descripcion no debe superar los 800 caracteres.'),
  body('reglas').optional().isArray({ max: 15 }).withMessage('Se permiten hasta 15 reglas.'),
  body('esPrivada').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
];

// ---------------------------------------------------------------- Eventos
const validarCrearEvento = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre del evento es obligatorio.')
    .isLength({ min: 3, max: 160 })
    .withMessage('El nombre debe tener entre 3 y 160 caracteres.'),
  body('fecha').isISO8601().withMessage('La fecha del evento no es valida.'),
  body('horaFin').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('La hora de fin no es valida.'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripcion no debe superar los 2000 caracteres.'),
  body('ubicacion').optional().trim().isLength({ max: 200 }).withMessage('La ubicacion es demasiado larga.'),
  body('cupos').optional().isInt({ min: 0, max: 100000 }).withMessage('Los cupos deben ser un numero positivo.'),
  body('esInstitucional').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
  body('comunidad').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('La comunidad no es valida.'),
];

const validarAsistencia = [
  body('estado').isIn(ESTADOS_ASISTENCIA).withMessage('El estado de asistencia no es valido.'),
];

// ---------------------------------------------------------------- Productos
const validarCrearProducto = [
  body('titulo')
    .trim()
    .notEmpty()
    .withMessage('El titulo del producto es obligatorio.')
    .isLength({ min: 3, max: 140 })
    .withMessage('El titulo debe tener entre 3 y 140 caracteres.'),
  body('precio').isFloat({ min: 0, max: 1000000 }).withMessage('El precio debe ser un numero positivo.'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripcion no debe superar los 2000 caracteres.'),
  body('categoria').optional().isIn(CATEGORIAS_PRODUCTO).withMessage('La categoria no es valida.'),
  body('estado').optional().isIn(ESTADOS_PRODUCTO).withMessage('El estado no es valido.'),
  body('moneda').optional().isIn(['BOB', 'USD']).withMessage('La moneda no es valida.'),
  body('imagenes').optional().isArray({ max: 6 }).withMessage('Se permiten hasta 6 imagenes.'),
  body('ubicacion').optional().trim().isLength({ max: 120 }).withMessage('La ubicacion es demasiado larga.'),
];

const validarActualizarProducto = [
  body('titulo').optional().trim().isLength({ min: 3, max: 140 }).withMessage('Titulo invalido.'),
  body('precio').optional().isFloat({ min: 0, max: 1000000 }).withMessage('Precio invalido.'),
  body('categoria').optional().isIn(CATEGORIAS_PRODUCTO).withMessage('La categoria no es valida.'),
  body('estado').optional().isIn(ESTADOS_PRODUCTO).withMessage('El estado no es valido.'),
];

// ---------------------------------------------------------------- Reportes
const validarCrearReporte = [
  body('tipo').isIn(TIPOS_REPORTE).withMessage('El tipo de contenido a reportar no es valido.'),
  body('objetivoId').isMongoId().withMessage('El contenido reportado no es valido.'),
  body('motivo').isIn(MOTIVOS_REPORTE).withMessage('El motivo del reporte no es valido.'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 800 })
    .withMessage('La descripcion del reporte no debe superar los 800 caracteres.'),
];

const validarResolverReporte = [
  body('estado').isIn(ESTADOS_REPORTE).withMessage('El estado del reporte no es valido.'),
  body('notaRevision')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La nota de revision no debe superar los 500 caracteres.'),
  body('accion')
    .optional()
    .isIn(['ninguna', 'eliminar_contenido', 'bloquear_usuario'])
    .withMessage('La accion indicada no es valida.'),
];

// ---------------------------------------------------------------- Mensajes
const validarEnviarMensaje = [
  body('contenido')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('El mensaje no debe superar los 2000 caracteres.'),
  body('imagen').optional().isString().isLength({ max: 300 }).withMessage('La imagen no es valida.'),
  body('conversacionId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Conversacion invalida.'),
  body('destinatarioId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Destinatario invalido.'),
  body().custom((valor, { req }) => {
    if (!req.body.contenido && !req.body.imagen) {
      throw new Error('El mensaje debe tener contenido o una imagen.');
    }
    if (!req.body.conversacionId && !req.body.destinatarioId) {
      throw new Error('Debes indicar la conversacion o el destinatario.');
    }
    return true;
  }),
];

// ---------------------------------------------------------------- Historias
const validarCrearHistoria = [
  body('texto').optional().trim().isLength({ max: 300 }).withMessage('El texto no debe superar los 300 caracteres.'),
  body('imagen').optional().isString().isLength({ max: 300 }).withMessage('La imagen no es valida.'),
  body('colorFondo')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('El color de fondo no es valido.'),
  body().custom((valor, { req }) => {
    if (!req.body.texto && !req.body.imagen) {
      throw new Error('La historia debe tener texto o imagen.');
    }
    return true;
  }),
];

// ---------------------------------------------------------------- Busqueda
const validarBusquedaGlobal = [
  query('buscar').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Texto de busqueda invalido.'),
  query('tipo')
    .optional()
    .isIn(['todo', 'usuarios', 'publicaciones', 'comunidades', 'eventos', 'productos'])
    .withMessage('El tipo de busqueda no es valido.'),
];

module.exports = {
  validarCrearPublicacion,
  validarActualizarPublicacion,
  validarCompartir,
  validarCrearComentario,
  validarActualizarComentario,
  validarReaccion,
  validarCrearComunidad,
  validarActualizarComunidad,
  validarCrearEvento,
  validarAsistencia,
  validarCrearProducto,
  validarActualizarProducto,
  validarCrearReporte,
  validarResolverReporte,
  validarEnviarMensaje,
  validarCrearHistoria,
  validarBusquedaGlobal,
};
