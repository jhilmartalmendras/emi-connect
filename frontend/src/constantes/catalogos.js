/**
 * Catalogos de la interfaz.
 * Las etiquetas visibles llevan tildes correctamente; los valores internos
 * que se envian al backend se mantienen sin tildes (codigo en espanol sin tildes).
 */

export const CATEGORIAS_PUBLICACION = [
  { valor: 'general', etiqueta: 'General', color: 'bg-emi-100 text-emi-700 dark:bg-emi-800 dark:text-emi-100' },
  { valor: 'academica', etiqueta: 'Academica', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
  {
    valor: 'institucional',
    etiqueta: 'Institucional',
    color: 'bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100',
  },
  { valor: 'evento', etiqueta: 'Evento', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' },
  { valor: 'venta', etiqueta: 'Venta', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
  { valor: 'pregunta', etiqueta: 'Pregunta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' },
  { valor: 'logro', etiqueta: 'Logro', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100' },
];

export const TIPOS_REACCION = [
  { valor: 'me_gusta', etiqueta: 'Me gusta', emoji: '👍', color: 'text-emi-600' },
  { valor: 'me_encanta', etiqueta: 'Me encanta', emoji: '❤️', color: 'text-red-500' },
  { valor: 'me_divierte', etiqueta: 'Me divierte', emoji: '😂', color: 'text-dorado-500' },
  { valor: 'me_sorprende', etiqueta: 'Me sorprende', emoji: '😮', color: 'text-dorado-500' },
  { valor: 'me_entristece', etiqueta: 'Me entristece', emoji: '😢', color: 'text-blue-500' },
  { valor: 'me_enoja', etiqueta: 'Me enoja', emoji: '😡', color: 'text-red-600' },
];

export const ROLES = [
  { valor: 'estudiante', etiqueta: 'Estudiante', color: 'bg-emi-100 text-emi-700 dark:bg-emi-800 dark:text-emi-100' },
  { valor: 'docente', etiqueta: 'Docente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
  {
    valor: 'administrativo',
    etiqueta: 'Administrativo',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
  },
  {
    valor: 'moderador',
    etiqueta: 'Moderador',
    color: 'bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100',
  },
  {
    valor: 'administrador',
    etiqueta: 'Administrador',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  },
];

export const CATEGORIAS_PRODUCTO = [
  { valor: 'libros', etiqueta: 'Libros' },
  { valor: 'electronica', etiqueta: 'Electronica' },
  { valor: 'computadoras', etiqueta: 'Computadoras' },
  { valor: 'celulares', etiqueta: 'Celulares' },
  { valor: 'ropa', etiqueta: 'Ropa' },
  { valor: 'material_academico', etiqueta: 'Material academico' },
  { valor: 'otros', etiqueta: 'Otros' },
];

export const ESTADOS_PRODUCTO = [
  { valor: 'disponible', etiqueta: 'Disponible', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
  { valor: 'reservado', etiqueta: 'Reservado', color: 'bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100' },
  { valor: 'vendido', etiqueta: 'Vendido', color: 'bg-emi-100 text-emi-700 dark:bg-emi-800 dark:text-emi-100' },
  { valor: 'pausado', etiqueta: 'Pausado', color: 'bg-gray-200 text-gray-700 dark:bg-emi-800 dark:text-emi-100' },
];

export const ESTADOS_ASISTENCIA = [
  { valor: 'asistire', etiqueta: 'Asistire', color: 'bg-green-600 hover:bg-green-700' },
  { valor: 'interesado', etiqueta: 'Me interesa', color: 'bg-dorado-500 hover:bg-dorado-600' },
  { valor: 'no_asistire', etiqueta: 'No asistire', color: 'bg-emi-200 hover:bg-emi-300 text-emi-900' },
];

export const ESTADOS_REPORTE = [
  { valor: 'pendiente', etiqueta: 'Pendiente', color: 'bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100' },
  { valor: 'en_revision', etiqueta: 'En revision', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
  { valor: 'resuelto', etiqueta: 'Resuelto', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
  { valor: 'rechazado', etiqueta: 'Rechazado', color: 'bg-gray-200 text-gray-700 dark:bg-emi-800 dark:text-emi-100' },
];

export const MOTIVOS_REPORTE = [
  { valor: 'spam', etiqueta: 'Spam o publicidad no deseada' },
  { valor: 'acoso', etiqueta: 'Acoso o intimidacion' },
  { valor: 'contenido_ofensivo', etiqueta: 'Contenido ofensivo' },
  { valor: 'informacion_falsa', etiqueta: 'Informacion falsa' },
  { valor: 'contenido_inapropiado', etiqueta: 'Contenido inapropiado' },
  { valor: 'suplantacion', etiqueta: 'Suplantacion de identidad' },
  { valor: 'otro', etiqueta: 'Otro motivo' },
];

export const NIVELES_PRIVACIDAD = [
  { valor: 'miembros_emi', etiqueta: 'Todos los miembros EMI' },
  { valor: 'limitado', etiqueta: 'Limitado' },
  { valor: 'solo_amigos', etiqueta: 'Solo mis contactos' },
];

/** Obtiene la etiqueta legible de una categoria de publicacion. */
export function etiquetaCategoria(valor) {
  const encontrada = CATEGORIAS_PUBLICACION.find((item) => item.valor === valor);
  return encontrada ? encontrada.etiqueta : valor;
}

/** Obtiene la informacion de color de una categoria. */
export function colorCategoria(valor) {
  const encontrada = CATEGORIAS_PUBLICACION.find((item) => item.valor === valor);
  return encontrada ? encontrada.color : 'bg-emi-100 text-emi-700';
}

/** Obtiene la etiqueta legible de un rol. */
export function etiquetaRol(valor) {
  const encontrado = ROLES.find((item) => item.valor === valor);
  return encontrado ? encontrado.etiqueta : valor;
}

/** Obtiene una reaccion por su valor. */
export function obtenerReaccion(valor) {
  return TIPOS_REACCION.find((item) => item.valor === valor) || null;
}
