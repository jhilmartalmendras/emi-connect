const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/** Origen del backend (sin /api) usado para construir rutas de archivos. */
export const ORIGEN_BACKEND = URL_API.replace(/\/api\/?$/, '');

/** Convierte una ruta de archivo del backend en URL absoluta. */
export function urlArchivo(ruta) {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${ORIGEN_BACKEND}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
}

/** Construye las iniciales de un nombre completo (maximo dos letras). */
export function iniciales(nombres = '', apellidos = '') {
  const primeraParte = String(nombres).trim().charAt(0);
  const segundaParte = String(apellidos).trim().charAt(0);
  return `${primeraParte}${segundaParte}`.toUpperCase() || '?';
}

/** Nombre completo a partir de nombres y apellidos. */
export function nombreCompleto(usuario) {
  if (!usuario) return 'Usuario';
  if (usuario.nombreCompleto) return usuario.nombreCompleto;
  return `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || 'Usuario';
}

/** Recorta un texto largo agregando puntos suspensivos. */
export function recortar(texto = '', longitud = 120) {
  if (!texto) return '';
  if (texto.length <= longitud) return texto;
  return `${texto.slice(0, longitud).trim()}…`;
}

/** Formatea un precio con separador de miles. */
export function formatearPrecio(valor, moneda = 'BOB') {
  const numero = Number(valor) || 0;
  const simbolo = moneda === 'USD' ? 'USD' : 'Bs';
  return `${simbolo} ${numero.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Convierte un texto en una lista de etiquetas limpias. */
export function separarEtiquetas(texto = '') {
  return String(texto)
    .split(',')
    .map((etiqueta) => etiqueta.trim().replace(/^#/, ''))
    .filter((etiqueta) => etiqueta.length > 1)
    .slice(0, 10);
}

/** Genera un color estable a partir de un identificador (para avatares). */
export function colorDesdeTexto(texto = '') {
  const colores = ['#1d4d8c', '#0b2039', '#2a63ab', '#8f5f10', '#166534', '#7c2d12', '#4c1d95', '#0f766e'];
  let suma = 0;
  String(texto)
    .split('')
    .forEach((caracter) => {
      suma += caracter.charCodeAt(0);
    });
  return colores[suma % colores.length];
}

/** Pluraliza una palabra segun la cantidad. */
export function plural(cantidad, singular, pluralTexto) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto || `${singular}s`}`;
}
