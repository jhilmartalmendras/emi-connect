const { repositorioComentario } = require('../repositorios/repositorioComentario');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioReaccion } = require('../repositorios/repositorioReaccion');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { esRolAdministracion } = require('../constantes/roles');

const NIVEL_MAXIMO_ANIDAMIENTO = 3;

/**
 * Servicio de comentarios.
 * Soporta respuestas anidadas hasta 3 niveles y reacciones en cada comentario.
 */
const servicioComentario = {
  /** Agrega la reaccion del usuario a una lista de comentarios (una sola consulta). */
  async enriquecerComentarios(comentarios, usuarioId) {
    if (!comentarios || comentarios.length === 0) return [];
    if (!usuarioId) return comentarios.map((comentario) => ({ ...comentario, miReaccion: null }));

    const ids = comentarios.map((comentario) => comentario._id);
    const reacciones = await repositorioReaccion.listarDeUsuarioEnObjetivos(usuarioId, ids);
    const mapa = new Map(reacciones.map((reaccion) => [String(reaccion.objetivo), reaccion.tipo]));

    return comentarios.map((comentario) => ({
      ...comentario,
      miReaccion: mapa.get(String(comentario._id)) || null,
    }));
  },

  /** Crea un comentario o una respuesta dentro de un hilo. */
  async crearComentario(usuario, { publicacionId, contenido, comentarioPadreId = null }) {
    const publicacion = await repositorioPublicacion.buscarPorId(publicacionId, false);
    if (!publicacion || publicacion.eliminado) {
      throw ErrorAplicacion.noEncontrado('La publicacion no existe o fue eliminada.');
    }

    const autorPublicacionId = publicacion.autor._id || publicacion.autor;
    const bloqueo = await repositorioBloqueo.existeBloqueoEntre(usuario._id, autorPublicacionId);
    if (bloqueo) throw ErrorAplicacion.prohibido('No puedes comentar en esta publicacion.');

    let nivel = 1;
    let respondeA = null;

    if (comentarioPadreId) {
      const padre = await repositorioComentario.buscarPorId(comentarioPadreId);
      if (!padre || padre.eliminado) throw ErrorAplicacion.noEncontrado('El comentario respondido no existe.');
      if (String(padre.publicacion) !== String(publicacionId)) {
        throw ErrorAplicacion.solicitudInvalida('El comentario padre pertenece a otra publicacion.');
      }
      if (padre.nivel >= NIVEL_MAXIMO_ANIDAMIENTO) {
        // Se limita la profundidad: las respuestas profundas se cuelgan del nivel maximo.
        comentarioPadreId = padre.comentarioPadre || padre._id;
        nivel = NIVEL_MAXIMO_ANIDAMIENTO;
      } else {
        nivel = padre.nivel + 1;
      }
      respondeA = padre.autor._id || padre.autor;
    }

    const comentario = await repositorioComentario.crear({
      publicacion: publicacionId,
      autor: usuario._id,
      contenido,
      comentarioPadre: comentarioPadreId || null,
      nivel,
      respondeA,
    });

    await repositorioPublicacion.incrementarCampos(publicacionId, { cantidadComentarios: 1 });
    if (comentarioPadreId) {
      await repositorioComentario.incrementarCampos(comentarioPadreId, { cantidadRespuestas: 1 });
    }

    // Notificacion al autor de la publicacion.
    await servicioNotificacion.crear({
      usuario: autorPublicacionId,
      actor: usuario._id,
      tipo: 'comentario',
      titulo: `${usuario.nombres} comento tu publicacion`,
      mensaje: contenido.slice(0, 120),
      enlace: `/publicacion/${publicacionId}`,
      referencias: { publicacion: publicacionId, comentario: comentario._id },
    });

    // Notificacion al autor del comentario respondido (si es otra persona).
    if (respondeA && String(respondeA) !== String(autorPublicacionId)) {
      await servicioNotificacion.crear({
        usuario: respondeA,
        actor: usuario._id,
        tipo: 'comentario',
        titulo: `${usuario.nombres} respondio tu comentario`,
        mensaje: contenido.slice(0, 120),
        enlace: `/publicacion/${publicacionId}`,
        referencias: { publicacion: publicacionId, comentario: comentario._id },
      });
    }

    return comentario;
  },

  /**
   * Lista los comentarios de una publicacion con sus respuestas.
   * Se resuelven en dos consultas: raices y respuestas del conjunto.
   */
  async listarComentarios(publicacionId, usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 15, 50);

    const [raices, total] = await Promise.all([
      repositorioComentario.listarPorPublicacion(publicacionId, { saltar, limite }),
      repositorioComentario.contarPorPublicacion(publicacionId),
    ]);

    const idsRaices = raices.map((comentario) => comentario._id);
    const respuestas = idsRaices.length > 0 ? await repositorioComentario.listarRespuestasDe(idsRaices) : [];

    // Se agrupan las respuestas por comentario padre en memoria (sin consultas extra).
    const respuestasPorPadre = new Map();
    respuestas.forEach((respuesta) => {
      const clave = String(respuesta.comentarioPadre);
      if (!respuestasPorPadre.has(clave)) respuestasPorPadre.set(clave, []);
      respuestasPorPadre.get(clave).push(respuesta);
    });

    const conReacciones = await this.enriquecerComentarios(
      raices.map((raiz) => ({
        ...raiz,
        respuestas: respuestasPorPadre.get(String(raiz._id)) || [],
      })),
      usuarioId
    );

    return {
      comentarios: conReacciones,
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },

  /** Edita un comentario propio (o como administracion). */
  async actualizarComentario(id, usuario, contenido) {
    const comentario = await repositorioComentario.buscarPorId(id);
    if (!comentario || comentario.eliminado) throw ErrorAplicacion.noEncontrado('El comentario no existe.');

    const esAutor = String(comentario.autor._id) === String(usuario._id);
    if (!esAutor && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo el autor puede editar este comentario.');
    }

    return repositorioComentario.actualizarPorId(id, { contenido, editado: true });
  },

  /** Elimina (logicamente) un comentario propio o como administracion. */
  async eliminarComentario(id, usuario) {
    const comentario = await repositorioComentario.buscarPorId(id);
    if (!comentario || comentario.eliminado) throw ErrorAplicacion.noEncontrado('El comentario no existe.');

    const esAutor = String(comentario.autor._id) === String(usuario._id);
    if (!esAutor && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('No tienes permisos para eliminar este comentario.');
    }

    await repositorioComentario.marcarEliminado(id);
    await repositorioReaccion.eliminarPorObjetivo(id);
    await repositorioPublicacion.incrementarCampos(comentario.publicacion, { cantidadComentarios: -1 });

    if (comentario.comentarioPadre) {
      await repositorioComentario.incrementarCampos(comentario.comentarioPadre, { cantidadRespuestas: -1 });
    }

    return { mensaje: 'Comentario eliminado.' };
  },
};

module.exports = { servicioComentario, NIVEL_MAXIMO_ANIDAMIENTO };
