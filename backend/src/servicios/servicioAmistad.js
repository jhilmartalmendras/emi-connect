const { repositorioAmistad } = require('../repositorios/repositorioAmistad');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { repositorioPrivacidad } = require('../repositorios/repositorioPrivacidad');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');

/**
 * Servicio de amistades.
 * Estados posibles: pendiente, aceptada, rechazada, cancelada, bloqueada.
 */
const servicioAmistad = {
  /** Envia una solicitud de amistad validando privacidad y bloqueos. */
  async enviarSolicitud(solicitanteId, receptorId, mensaje = '') {
    if (String(solicitanteId) === String(receptorId)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes enviarte una solicitud a ti mismo.');
    }

    const receptor = await repositorioUsuario.buscarPorId(receptorId);
    if (!receptor || receptor.cuentaEliminada) {
      throw ErrorAplicacion.noEncontrado('El usuario no existe.');
    }

    const bloqueo = await repositorioBloqueo.existeBloqueoEntre(solicitanteId, receptorId);
    if (bloqueo) {
      throw ErrorAplicacion.prohibido('No es posible enviar la solicitud a este usuario.');
    }

    const privacidad = await repositorioPrivacidad.obtenerOCrear(receptorId);
    if (privacidad?.quienPuedeEnviarSolicitudes === 'solo_amigos') {
      throw ErrorAplicacion.prohibido('Este usuario solo acepta solicitudes de sus contactos.');
    }

    const existente = await repositorioAmistad.buscarEntreDos(solicitanteId, receptorId);

    if (existente) {
      if (existente.estado === 'aceptada') {
        throw ErrorAplicacion.conflicto('Ya son amigos en EMI Connect.');
      }
      if (existente.estado === 'pendiente') {
        // Si la solicitud pendiente es del otro usuario, se acepta automaticamente.
        if (String(existente.solicitante) === String(receptorId)) {
          return this.aceptarSolicitud(existente._id, solicitanteId);
        }
        throw ErrorAplicacion.conflicto('Ya enviaste una solicitud a este usuario.');
      }
      // Rechazada o cancelada: se reutiliza el registro.
      const actualizada = await repositorioAmistad.actualizarPorId(existente._id, {
        solicitante: solicitanteId,
        receptor: receptorId,
        estado: 'pendiente',
        mensaje,
        fechaRespuesta: null,
        leidaPorReceptor: false,
      });

      await servicioNotificacion.crear({
        usuario: receptorId,
        actor: solicitanteId,
        tipo: 'solicitud_amistad',
        titulo: 'Nueva solicitud de amistad',
        mensaje: 'Tienes una nueva solicitud de amistad en EMI Connect.',
        enlace: '/amigos',
      });

      return { amistad: actualizada, mensaje: 'Solicitud de amistad enviada.' };
    }

    const amistad = await repositorioAmistad.crear({
      solicitante: solicitanteId,
      receptor: receptorId,
      estado: 'pendiente',
      mensaje,
    });

    await servicioNotificacion.crear({
      usuario: receptorId,
      actor: solicitanteId,
      tipo: 'solicitud_amistad',
      titulo: 'Nueva solicitud de amistad',
      mensaje: 'Tienes una nueva solicitud de amistad en EMI Connect.',
      enlace: '/amigos',
    });

    return { amistad, mensaje: 'Solicitud de amistad enviada.' };
  },

  /** Acepta una solicitud recibida. */
  async aceptarSolicitud(amistadId, usuarioId) {
    const amistad = await repositorioAmistad.buscarPorId(amistadId);
    if (!amistad) throw ErrorAplicacion.noEncontrado('La solicitud no existe.');
    if (String(amistad.receptor._id || amistad.receptor) !== String(usuarioId)) {
      throw ErrorAplicacion.prohibido('Solo el receptor puede aceptar la solicitud.');
    }
    if (amistad.estado !== 'pendiente') {
      throw ErrorAplicacion.conflicto('Esta solicitud ya fue procesada.');
    }

    const actualizada = await repositorioAmistad.actualizarPorId(amistadId, {
      estado: 'aceptada',
      fechaRespuesta: new Date(),
      leidaPorReceptor: true,
    });

    // Se actualizan los contadores de amigos de ambos usuarios.
    const solicitanteId = String(amistad.solicitante._id || amistad.solicitante);
    const [cantidadSolicitante, cantidadReceptor] = await Promise.all([
      repositorioAmistad.contarAceptadas(solicitanteId),
      repositorioAmistad.contarAceptadas(usuarioId),
    ]);
    await Promise.all([
      repositorioUsuario.actualizarPorId(solicitanteId, { cantidadAmigos: cantidadSolicitante }),
      repositorioUsuario.actualizarPorId(usuarioId, { cantidadAmigos: cantidadReceptor }),
    ]);

    await servicioNotificacion.crear({
      usuario: solicitanteId,
      actor: usuarioId,
      tipo: 'amistad_aceptada',
      titulo: 'Solicitud aceptada',
      mensaje: 'Tu solicitud de amistad fue aceptada.',
      enlace: '/amigos',
    });

    return { amistad: actualizada, mensaje: 'Solicitud aceptada correctamente.' };
  },

  async rechazarSolicitud(amistadId, usuarioId) {
    const amistad = await repositorioAmistad.buscarPorId(amistadId);
    if (!amistad) throw ErrorAplicacion.noEncontrado('La solicitud no existe.');
    if (String(amistad.receptor._id || amistad.receptor) !== String(usuarioId)) {
      throw ErrorAplicacion.prohibido('Solo el receptor puede rechazar la solicitud.');
    }

    const actualizada = await repositorioAmistad.actualizarPorId(amistadId, {
      estado: 'rechazada',
      fechaRespuesta: new Date(),
      leidaPorReceptor: true,
    });

    return { amistad: actualizada, mensaje: 'Solicitud rechazada.' };
  },

  /** Cancela una solicitud enviada que aun esta pendiente. */
  async cancelarSolicitud(amistadId, usuarioId) {
    const amistad = await repositorioAmistad.buscarPorId(amistadId);
    if (!amistad) throw ErrorAplicacion.noEncontrado('La solicitud no existe.');
    if (String(amistad.solicitante._id || amistad.solicitante) !== String(usuarioId)) {
      throw ErrorAplicacion.prohibido('Solo el solicitante puede cancelar la solicitud.');
    }
    if (amistad.estado !== 'pendiente') {
      throw ErrorAplicacion.conflicto('Solo se pueden cancelar solicitudes pendientes.');
    }

    const actualizada = await repositorioAmistad.actualizarPorId(amistadId, { estado: 'cancelada' });
    return { amistad: actualizada, mensaje: 'Solicitud cancelada.' };
  },

  /** Elimina una amistad aceptada. */
  async eliminarAmistad(usuarioId, otroUsuarioId) {
    const amistad = await repositorioAmistad.buscarEntreDos(usuarioId, otroUsuarioId);
    if (!amistad) throw ErrorAplicacion.noEncontrado('No existe una amistad con este usuario.');
    if (amistad.estado !== 'aceptada') {
      throw ErrorAplicacion.solicitudInvalida('La relacion no corresponde a una amistad aceptada.');
    }

    await repositorioAmistad.eliminarPorId(amistad._id);

    const [cantidadPropia, cantidadOtro] = await Promise.all([
      repositorioAmistad.contarAceptadas(usuarioId),
      repositorioAmistad.contarAceptadas(otroUsuarioId),
    ]);
    await Promise.all([
      repositorioUsuario.actualizarPorId(usuarioId, { cantidadAmigos: cantidadPropia }),
      repositorioUsuario.actualizarPorId(otroUsuarioId, { cantidadAmigos: cantidadOtro }),
    ]);

    return { mensaje: 'Amistad eliminada.' };
  },

  /** Lista de amigos confirmados con su informacion publica. */
  async listarAmigos(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 60);
    const relaciones = await repositorioAmistad.listarAceptadas(usuarioId, { saltar, limite });

    const amigos = relaciones.map((relacion) => {
      const esSolicitante = String(relacion.solicitante._id) === String(usuarioId);
      const amigo = esSolicitante ? relacion.receptor : relacion.solicitante;
      return { _id: relacion._id, ...amigo, desde: relacion.fechaRespuesta || relacion.fechaCreacion };
    });

    return { amigos, paginacion: metadatosPaginacion(amigos.length, pagina, limite) };
  },

  async listarIdsAmigos(usuarioId) {
    const relaciones = await repositorioAmistad.listarIdsRelacionados(usuarioId, 'aceptada');
    return relaciones.map((relacion) =>
      String(relacion.solicitante) === String(usuarioId) ? String(relacion.receptor) : String(relacion.solicitante)
    );
  },

  async listarSolicitudesRecibidas(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 50);
    const [solicitudes, total] = await Promise.all([
      repositorioAmistad.listarSolicitudesRecibidas(usuarioId, { saltar, limite }),
      repositorioAmistad.contarPendientes(usuarioId),
    ]);
    return { solicitudes, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  async listarSolicitudesEnviadas(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 50);
    const solicitudes = await repositorioAmistad.listarSolicitudesEnviadas(usuarioId, { saltar, limite });
    return { solicitudes, paginacion: metadatosPaginacion(solicitudes.length, pagina, limite) };
  },

  contarPendientes(usuarioId) {
    return repositorioAmistad.contarPendientes(usuarioId);
  },
};

module.exports = { servicioAmistad };
