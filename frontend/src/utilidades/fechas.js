/**
 * Utilidades de fecha para la interfaz.
 * Se implementan manualmente (sin librerias externas) para mantener el
 * proyecto liviano y compatible con navegadores antiguos.
 */

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/** Devuelve "hace 5 minutos", "ayer", "hace 3 dias" o la fecha completa. */
export function tiempoRelativo(fecha) {
  if (!fecha) return '';
  const momento = new Date(fecha);
  const diferencia = Date.now() - momento.getTime();

  if (Number.isNaN(diferencia)) return '';

  const segundos = Math.floor(diferencia / 1000);
  if (segundos < 45) return 'hace unos segundos';

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} minuto${minutos === 1 ? '' : 's'}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} hora${horas === 1 ? '' : 's'}`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} dias`;

  const semanas = Math.floor(dias / 7);
  if (semanas < 4) return `hace ${semanas} semana${semanas === 1 ? '' : 's'}`;

  return fechaCorta(momento);
}

/** Formato corto: 12 de marzo de 2026. */
export function fechaCorta(fecha) {
  if (!fecha) return '';
  const momento = new Date(fecha);
  if (Number.isNaN(momento.getTime())) return '';
  return `${momento.getDate()} de ${MESES[momento.getMonth()]} de ${momento.getFullYear()}`;
}

/** Formato con dia de la semana y hora: lunes 12 de marzo, 18:30. */
export function fechaCompleta(fecha) {
  if (!fecha) return '';
  const momento = new Date(fecha);
  if (Number.isNaN(momento.getTime())) return '';
  return `${DIAS[momento.getDay()]} ${momento.getDate()} de ${MESES[momento.getMonth()]}, ${horaCorta(momento)}`;
}

/** Hora en formato 24 horas: 18:30. */
export function horaCorta(fecha) {
  if (!fecha) return '';
  const momento = new Date(fecha);
  if (Number.isNaN(momento.getTime())) return '';
  const horas = String(momento.getHours()).padStart(2, '0');
  const minutos = String(momento.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

/** Valor para inputs de tipo datetime-local (formato local, sin zona horaria). */
export function paraInputFecha(fecha) {
  const momento = fecha ? new Date(fecha) : new Date();
  if (Number.isNaN(momento.getTime())) return '';
  const desplazamiento = momento.getTimezoneOffset() * 60000;
  return new Date(momento.getTime() - desplazamiento).toISOString().slice(0, 16);
}

/** Indica si una fecha ya paso. */
export function yaPaso(fecha) {
  if (!fecha) return false;
  return new Date(fecha).getTime() < Date.now();
}

/** Cuenta regresiva corta para eventos: "en 3 dias", "en 2 horas". */
export function tiempoHasta(fecha) {
  if (!fecha) return '';
  const diferencia = new Date(fecha).getTime() - Date.now();
  if (Number.isNaN(diferencia)) return '';
  if (diferencia < 0) return 'ya ocurrio';

  const minutos = Math.floor(diferencia / 60000);
  if (minutos < 60) return `en ${minutos} minuto${minutos === 1 ? '' : 's'}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `en ${horas} hora${horas === 1 ? '' : 's'}`;

  const dias = Math.floor(horas / 24);
  return `en ${dias} dia${dias === 1 ? '' : 's'}`;
}

/** Etiqueta corta para separar publicaciones por fecha. */
export function etiquetaDia(fecha) {
  if (!fecha) return '';
  const momento = new Date(fecha);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  if (momento.toDateString() === hoy.toDateString()) return 'Hoy';
  if (momento.toDateString() === ayer.toDateString()) return 'Ayer';
  return fechaCorta(momento);
}
