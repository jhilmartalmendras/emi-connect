/**
 * Puente de comunicacion en tiempo real (Socket.IO).
 *
 * Los servicios de negocio no conocen Socket.IO: solo llaman a estas funciones.
 * El servidor registra aqui la instancia de IO al arrancar. Si no hay servidor
 * de sockets activo (por ejemplo en pruebas), las funciones no hacen nada.
 */
let io = null;
const usuariosConectados = new Map(); // usuarioId -> Set de sockets

function registrarServidorTiempoReal(instanciaIo) {
  io = instanciaIo;
}

function usuarioEstaConectado(usuarioId) {
  return usuariosConectados.has(String(usuarioId));
}

function registrarConexion(usuarioId, socketId) {
  const clave = String(usuarioId);
  if (!usuariosConectados.has(clave)) usuariosConectados.set(clave, new Set());
  usuariosConectados.get(clave).add(socketId);
}

function quitarConexion(usuarioId, socketId) {
  const clave = String(usuarioId);
  const sockets = usuariosConectados.get(clave);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) usuariosConectados.delete(clave);
}

function listarUsuariosConectados() {
  return Array.from(usuariosConectados.keys());
}

/** Emite un evento a todas las sesiones de un usuario. */
function emitirAUsuario(usuarioId, evento, datos) {
  if (!io || !usuarioId) return;
  io.to(`usuario:${String(usuarioId)}`).emit(evento, datos);
}

function emitirNotificacion(usuarioId, notificacion) {
  emitirAUsuario(usuarioId, 'notificacion:nueva', notificacion);
}

function emitirContadorNoLeidasMensajes(usuarioId, total) {
  emitirAUsuario(usuarioId, 'mensajes:contador', { total });
}

function emitirNuevoMensaje(usuarioId, mensaje) {
  emitirAUsuario(usuarioId, 'mensaje:nuevo', mensaje);
}

function emitirMensajeLeido(usuarioId, datos) {
  emitirAUsuario(usuarioId, 'mensaje:leido', datos);
}

function emitirCambioEstadoUsuario(usuarioId, enLinea) {
  if (!io || !usuarioId) return;
  io.emit('usuario:estado', { usuario: String(usuarioId), enLinea });
}

module.exports = {
  registrarServidorTiempoReal,
  registrarConexion,
  quitarConexion,
  usuarioEstaConectado,
  listarUsuariosConectados,
  emitirAUsuario,
  emitirNotificacion,
  emitirNuevoMensaje,
  emitirMensajeLeido,
  emitirContadorNoLeidasMensajes,
  emitirCambioEstadoUsuario,
};
