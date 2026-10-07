const { repositorioReaccion } = require('../repositorios/repositorioReaccion');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioComentario } = require('../repositorios/repositorioComentario');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { TIPOS_REACCION } = require('../constantes/catalogos');

// Nombres legibles de cada reaccion para las notificaciones.
const ETIQUETAS_REACCION = {
  me_gusta: 'Me gusta',
  me_encanta: 'Me encanta',
  me_divierte: 'Me divierte',
  me_sorprende: 'Me sorprende',
  me_entristece: 'Me entristece',
  me_enoja: 'Me enoja',
};

/**
 * Servicio de reacciones.
 * Un usuario tiene una sola reaccion por publicacion o comentario; si vuelve a
 * reaccionar se actualiza el tipo y se corrigen los contadores.
 */
const servicioReaccion = {
  /** Obtiene el documento objetivo y valida que exista. */
  async obtenerObjetivo(objetivoId, objetivoModelo) {
    if (objetivoModelo === 'Publicacion') {
      const publicacion = await repositorioPublicacion.buscarPorId(objetivoId, false);
      if (!publicacion || publicacion.eliminado) {
        throw ErrorAplicacion.noEncontrado('La publicacion no existe o fue eliminada.');
      }
      return publicacion;
    }

    if (objetivoModelo === 'Comentario') {
      const comentario = await repositorioComentario.buscarPorId(objetivoId);
      if (!comentario || comentario.eliminado) {
        throw ErrorAplicacion.noEncontrado('El comentario no existe o fue eliminado.');
      }
      return comentario;
    }

    throw ErrorAplicacion.solicitudInvalida('El tipo de contenido a reaccionar no es valido.');
  },

  /** Actualiza el resumen de reacciones del objetivo con incrementos atomicos. */
  async actualizarResumen(objetivoId, objetivoModelo, tipo, delta) {
    const incremento = { [`reaccionesResumen.${tipo}`]: delta };

    if (objetivoModelo === 'Publicacion') {
      await repositorioPublicacion.incrementarCampos(objetivoId, incremento);
    } else {
      await repositorioComentario.incrementarCampos(objetivoId, incremento);
    }
  },

  /** Crea o cambia la reaccion del usuario sobre un objetivo. */
  async reaccionar(usuario, { objetivoId, objetivoModelo = 'Publicacion', tipo }) {
    if (!TIPOS_REACCION.includes(tipo)) {
      throw ErrorAplicacion.solicitudInvalida('El tipo de reaccion no es valido.');
    }

    const objetivo = await this.obtenerObjetivo(objetivoId, objetivoModelo);
    const reaccionAnterior = await repositorioReaccion.buscar({ usuario: usuario._id, objetivo: objetivoId });

    if (reaccionAnterior && reaccionAnterior.tipo === tipo) {
      // Al reaccionar con el mismo tipo se retira la reaccion (comportamiento tipo "me gusta").
      await repositorioReaccion.eliminar({ usuario: usuario._id, objetivo: objetivoId });
      await this.actualizarResumen(objetivoId, objetivoModelo, tipo, -1);

      return { reaccion: null, tipoReaccion: null, mensaje: 'Reaccion retirada.' };
    }

    await repositorioReaccion.crearOActualizar({
      usuario: usuario._id,
      objetivo: objetivoId,
      objetivoModelo,
      tipo,
    });

    if (reaccionAnterior && reaccionAnterior.tipo !== tipo) {
      // Cambio de reaccion: se descuenta la anterior y se suma la nueva.
      await this.actualizarResumen(objetivoId, objetivoModelo, reaccionAnterior.tipo, -1);
      await this.actualizarResumen(objetivoId, objetivoModelo, tipo, 1);
    } else {
      await this.actualizarResumen(objetivoId, objetivoModelo, tipo, 1);

      // Solo se notifica la primera reaccion, no el cambio de reaccion.
      const autorId = objetivo.autor._id || objetivo.autor;
      await servicioNotificacion.crear({
        usuario: autorId,
        actor: usuario._id,
        tipo: 'reaccion',
        titulo: `${usuario.nombres} reacciono con ${ETIQUETAS_REACCION[tipo]}`,
        mensaje:
          objetivoModelo === 'Publicacion'
            ? 'Reaccionaron a tu publicacion.'
            : 'Reaccionaron a tu comentario.',
        enlace: objetivoModelo === 'Publicacion' ? `/publicacion/${objetivoId}` : `/publicacion/${objetivo.publicacion}`,
        referencias:
          objetivoModelo === 'Publicacion'
            ? { publicacion: objetivoId }
            : { comentario: objetivoId, publicacion: objetivo.publicacion },
      });
    }

    const actualizado = await this.obtenerObjetivo(objetivoId, objetivoModelo);
    return {
      reaccion: tipo,
      tipoReaccion: tipo,
      resumen: actualizado.reaccionesResumen,
      mensaje: 'Reaccion registrada.',
    };
  },

  /** Retira la reaccion del usuario si existe. */
  async quitarReaccion(usuarioId, { objetivoId, objetivoModelo = 'Publicacion' }) {
    const reaccion = await repositorioReaccion.buscar({ usuario: usuarioId, objetivo: objetivoId });
    if (!reaccion) return { reaccion: null, mensaje: 'No existia una reaccion para retirar.' };

    await repositorioReaccion.eliminar({ usuario: usuarioId, objetivo: objetivoId });
    await this.actualizarResumen(objetivoId, objetivoModelo, reaccion.tipo, -1);

    return { reaccion: null, mensaje: 'Reaccion retirada.' };
  },

  /** Resumen de reacciones de un objetivo consultado directamente en la coleccion. */
  async obtenerResumen(objetivoId) {
    const resumen = await repositorioReaccion.contarPorTipo(objetivoId);
    const total = resumen.reduce((acumulado, item) => acumulado + item.cantidad, 0);
    return { total, detalle: resumen };
  },
};

module.exports = { servicioReaccion, ETIQUETAS_REACCION };
