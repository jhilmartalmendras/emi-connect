/**
 * Utilidades de tiempo centralizadas para tokens, historias y expiraciones.
 */
function ahora() {
  return new Date();
}

function sumarMinutos(minutos) {
  return new Date(Date.now() + minutos * 60 * 1000);
}

function sumarHoras(horas) {
  return new Date(Date.now() + horas * 60 * 60 * 1000);
}

function sumarDias(dias) {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
}

function yaExpiro(fecha) {
  if (!fecha) return true;
  return new Date(fecha).getTime() < Date.now();
}

function inicioDelDia(fecha = new Date()) {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function haceDias(dias) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
}

module.exports = { ahora, sumarMinutos, sumarHoras, sumarDias, yaExpiro, inicioDelDia, haceDias };
