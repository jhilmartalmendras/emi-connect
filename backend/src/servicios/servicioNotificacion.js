const { repositorioNotificacion } = require('../repositorios/repositorioNotificacion');
const { repositorioPrivacidad } = require('../repositorios/repositorioPrivacidad');
const { emitirNotificacion } = require('../aplicaciones/tiempoReal');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

/**
 * Servicio de notificaciones.
 * Centraliza la creacion de avisos y su envio en tiempo real.
 */
const servicioNotificacion = {
  /**
   * Crea una notificacion y la emite por Socket.IO si el usuario esta conectado.
   * Nunca notifica al propio actor.
   */
  async crear({
    usuario,
    tipo,
    titulo,
    mensaje = '',
    enlace = '',
    actor = null,
    referencias = {},
  }) {
    if (!usuario) return null;
    if (actor && String(actor) === String(usuario)) return null;

    try {
      // Se respeta la preferencia de notificaciones del usuario.
      const privacidad = await repositorioPrivacidad.obtenerOCrear(usuario);
      if (privacidad && privacidad.recibirNotificaciones === false) return null;

      const notificacion = await repositorioNotificacion.crear({
        usuario,
        tipo,
        titulo,
        mensaje,
        enlace,
        actor,
        referencias,
      });

      const plano = notificacion.toObject();
      emitirNotificacion(usuario, { ...plano, id: String(plano._id) });
      return notificacion;
    } catch (error) {
      // Una notificacion fallida no debe romper la accion principal.
      console.error('[notificaciones] No se pudo crear la notificacion:', error.message);
      return null;
    }
  },

  async listar(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 50);
    const soloNoLeidas = consulta.soloNoLeidas === 'true' || consulta.soloNoLeidas === true;

    const [notificaciones, total, noLeidas] = await Promise.all([
      repositorioNotificacion.listarPorUsuario(usuarioId, { soloNoLeidas, saltar, limite }),
      repositorioNotificacion.contar(usuarioId),
      repositorioNotificacion.contarNoLeidas(usuarioId),
    ]);

    return {
      notificaciones,
      noLeidas,
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },

  contarNoLeidas(usuarioId) {
    return repositorioNotificacion.contarNoLeidas(usuarioId);
  },

  async marcarLeida(id, usuarioId) {
    const notificacion = await repositorioNotificacion.marcarLeida(id, usuarioId);
    if (!notificacion) throw ErrorAplicacion.noEncontrado('La notificacion no existe');
    return notificacion;
  },

  marcarTodasLeidas(usuarioId) {
    return repositorioNotificacion.marcarTodasLeidas(usuarioId);
  },

  async eliminar(id, usuarioId) {
    const eliminada = await repositorioNotificacion.eliminarPorId(id, usuarioId);
    if (!eliminada) throw ErrorAplicacion.noEncontrado('La notificacion no existe');
    return eliminada;
  },
};

module.exports = { servicioNotificacion };
