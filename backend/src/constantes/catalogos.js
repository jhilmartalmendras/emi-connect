/**
 * Catalogos centralizados del sistema.
 * Al cambiar estos arreglos se actualizan automaticamente las validaciones
 * del backend y las opciones disponibles en la interfaz.
 */

// Categorias de publicaciones.
const CATEGORIAS_PUBLICACION = [
  'general',
  'academica',
  'institucional',
  'evento',
  'venta',
  'pregunta',
  'logro',
];

// Tipos de reaccion (una sola por usuario y publicacion).
const TIPOS_REACCION = ['me_gusta', 'me_encanta', 'me_divierte', 'me_sorprende', 'me_entristece', 'me_enoja'];

// Estados de la solicitud de amistad.
const ESTADOS_AMISTAD = ['pendiente', 'aceptada', 'rechazada', 'cancelada', 'bloqueada'];

// Estados de asistencia a eventos.
const ESTADOS_ASISTENCIA = ['interesado', 'asistire', 'no_asistire'];

// Estados de los reportes.
const ESTADOS_REPORTE = ['pendiente', 'en_revision', 'resuelto', 'rechazado'];

// Tipos de contenido reportable.
const TIPOS_REPORTE = ['publicacion', 'comentario', 'usuario', 'producto', 'comunidad'];

// Motivos de reporte.
const MOTIVOS_REPORTE = [
  'spam',
  'acoso',
  'contenido_ofensivo',
  'informacion_falsa',
  'contenido_inapropiado',
  'suplantacion',
  'otro',
];

// Categorias del marketplace.
const CATEGORIAS_PRODUCTO = [
  'libros',
  'electronica',
  'computadoras',
  'celulares',
  'ropa',
  'material_academico',
  'otros',
];

// Estados de un producto del marketplace.
const ESTADOS_PRODUCTO = ['disponible', 'reservado', 'vendido', 'pausado'];

// Niveles de privacidad.
const NIVELES_PRIVACIDAD = ['miembros_emi', 'limitado', 'solo_amigos'];

// Tipos de notificacion.
const TIPOS_NOTIFICACION = [
  'reaccion',
  'comentario',
  'solicitud_amistad',
  'amistad_aceptada',
  'mensaje',
  'evento',
  'comunidad',
  'publicacion_institucional',
  'reporte_resuelto',
  'sistema',
];

module.exports = {
  CATEGORIAS_PUBLICACION,
  TIPOS_REACCION,
  ESTADOS_AMISTAD,
  ESTADOS_ASISTENCIA,
  ESTADOS_REPORTE,
  TIPOS_REPORTE,
  MOTIVOS_REPORTE,
  CATEGORIAS_PRODUCTO,
  ESTADOS_PRODUCTO,
  NIVELES_PRIVACIDAD,
  TIPOS_NOTIFICACION,
};
