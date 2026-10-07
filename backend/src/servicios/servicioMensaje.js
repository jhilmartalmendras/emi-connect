const { repositorioConversacion } = require('../repositorios/repositorioConversacion');
const { repositorioMensaje } = require('../repositorios/repositorioMensaje');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { repositorioPrivacidad } = require('../repositorios/repositorioPrivacidad');
const { repositorioAmistad } = require('../repositorios/repositorioAmistad');
const { servicioNotificacion } = require('./servicioNotificacion');
const {
  emitirNuevoMensaje,
  emitirMensajeLeido,
  emitirContadorNoLeidasMensajes,
  usuarioEstaConectado,
} = require('../aplicaciones/tiempoReal');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');

/**
 * Servicio de mensajeria privada uno a uno.
 * Cada mensaje nuevo se emite por Socket.IO para que el receptor lo vea sin recargar.
 */
const servicioMensaje = {
  /** Valida que el usuario pueda escribirle al destinatario. */
  async validarConversacionPermitida(usuarioId, destinatarioId) {
    if (String(usuarioId) === String(destinatarioId)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes iniciar una conversacion contigo mismo.');
    }

    const destinatario = await repositorioUsuario.buscarPorId(destinatarioId);
    if (!destinatario || destinatario.cuentaEliminada) {
      throw ErrorAplicacion.noEncontrado('El usuario no existe.');
    }

    const bloqueo = await repositorioBloqueo.existeBloqueoEntre(usuarioId, destinatarioId);
    if (bloqueo) throw ErrorAplicacion.prohibido('No es posible enviar mensajes a este usuario.');

    const privacidad = await repositorioPrivacidad.obtenerOCrear(destinatarioId);
    if (privacidad?.quienPuedeEnviarMensajes === 'solo_amigos') {
      const amistad = await repositorioAmistad.buscarEntreDos(usuarioId, destinatarioId);
      if (!amistad || amistad.estado !== 'aceptada') {
        throw ErrorAplicacion.prohibido('Este usuario solo recibe mensajes de sus contactos.');
      }
    }

    return destinatario;
  },

  /** Obtiene la conversacion existente o la crea. */
  async obtenerOCrearConversacion(usuarioId, destinatarioId) {
    await this.validarConversacionPermitida(usuarioId, destinatarioId);

    let conversacion = await repositorioConversacion.buscarEntreDos(usuarioId, destinatarioId);
    if (!conversacion) {
      conversacion = await repositorioConversacion.crear([usuarioId, destinatarioId]);
      conversacion = await repositorioConversacion.buscarPorId(conversacion._id);
    } else {
      conversacion = await repositorioConversacion.buscarPorId(conversacion._id);
    }

    return this.formatearConversacion(conversacion, usuarioId);
  },

  /** Da formato a una conversacion desde la perspectiva del usuario actual. */
  formatearConversacion(conversacion, usuarioId) {
    const participantes = conversacion.participantes || [];
    const interlocutor = participantes.find(
      (participante) => String(participante._id || participante) !== String(usuarioId)
    );
    const registroNoLeidos = (conversacion.noLeidos || []).find(
      (registro) => String(registro.usuario) === String(usuarioId)
    );

    return {
      _id: conversacion._id,
      interlocutor,
      participantes,
      ultimoMensaje: conversacion.ultimoMensaje || null,
      fechaUltimoMensaje: conversacion.fechaUltimoMensaje,
      noLeidos: registroNoLeidos ? registroNoLeidos.cantidad : 0,
      activa: conversacion.activa,
    };
  },

  /** Lista las conversaciones del usuario ordenadas por actividad reciente. */
  async listarConversaciones(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 30, 60);
    const [conversaciones, total] = await Promise.all([
      repositorioConversacion.listarPorUsuario(usuarioId, { saltar, limite }),
      repositorioConversacion.contarPorUsuario(usuarioId),
    ]);

    return {
      conversaciones: conversaciones.map((conversacion) => this.formatearConversacion(conversacion, usuarioId)),
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },

  /** Envia un mensaje y lo emite en tiempo real. */
  async enviarMensaje(usuario, { conversacionId, destinatarioId, contenido = '', imagen = '' }) {
    if (!contenido && !imagen) {
      throw ErrorAplicacion.solicitudInvalida('El mensaje debe tener contenido o una imagen.');
    }

    let conversacion;
    if (conversacionId) {
      conversacion = await repositorioConversacion.buscarPorId(conversacionId);
      if (!conversacion) throw ErrorAplicacion.noEncontrado('La conversacion no existe.');

      const participa = conversacion.participantes.some(
        (participante) => String(participante._id) === String(usuario._id)
      );
      if (!participa) throw ErrorAplicacion.prohibido('No participas en esta conversacion.');
    } else if (destinatarioId) {
      const conversacionExistente = await repositorioConversacion.buscarEntreDos(usuario._id, destinatarioId);
      if (conversacionExistente) {
        conversacion = await repositorioConversacion.buscarPorId(conversacionExistente._id);
      } else {
        await this.validarConversacionPermitida(usuario._id, destinatarioId);
        const creada = await repositorioConversacion.crear([usuario._id, destinatarioId]);
        conversacion = await repositorioConversacion.buscarPorId(creada._id);
      }
    } else {
      throw ErrorAplicacion.solicitudInvalida('Debes indicar la conversacion o el destinatario.');
    }

    const receptor = conversacion.participantes.find(
      (participante) => String(participante._id) !== String(usuario._id)
    );

    const mensaje = await repositorioMensaje.crear({
      conversacion: conversacion._id,
      emisor: usuario._id,
      contenido,
      imagen,
    });

    await Promise.all([
      repositorioConversacion.actualizarUltimoMensaje(conversacion._id, mensaje._id),
      repositorioConversacion.incrementarNoLeidos(conversacion._id, receptor._id, 1),
    ]);

    const datosMensaje = {
      ...mensaje.toObject(),
      emisor: {
        _id: usuario._id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        fotoPerfil: usuario.fotoPerfil,
      },
      conversacionId: String(conversacion._id),
    };

    // Emision en tiempo real al receptor y confirmacion al emisor.
    emitirNuevoMensaje(receptor._id, datosMensaje);
    emitirNuevoMensaje(usuario._id, datosMensaje);

    const totalNoLeidos = await this.contarNoLeidosTotales(receptor._id);
    emitirContadorNoLeidasMensajes(receptor._id, totalNoLeidos);

    // Se notifica solo si el receptor no esta conectado en ese momento.
    if (!usuarioEstaConectado(receptor._id)) {
      await servicioNotificacion.crear({
        usuario: receptor._id,
        actor: usuario._id,
        tipo: 'mensaje',
        titulo: `Nuevo mensaje de ${usuario.nombres}`,
        mensaje: contenido ? contenido.slice(0, 120) : 'Te enviaron una imagen.',
        enlace: `/mensajes?conversacion=${conversacion._id}`,
        referencias: { conversacion: conversacion._id },
      });
    }

    return datosMensaje;
  },

  /** Historial de mensajes de una conversacion. */
  async listarMensajes(conversacionId, usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 30, 60);

    const conversacion = await repositorioConversacion.buscarPorId(conversacionId);
    if (!conversacion) throw ErrorAplicacion.noEncontrado('La conversacion no existe.');

    const participa = conversacion.participantes.some(
      (participante) => String(participante._id) === String(usuarioId)
    );
    if (!participa) throw ErrorAplicacion.prohibido('No participas en esta conversacion.');

    const [mensajes, total] = await Promise.all([
      repositorioMensaje.listarPorConversacion(conversacionId, { saltar, limite }),
      repositorioMensaje.contarPorConversacion(conversacionId),
    ]);

    return {
      mensajes: mensajes.reverse(),
      paginacion: metadatosPaginacion(total, pagina, limite),
      interlocutor: this.formatearConversacion(conversacion, usuarioId).interlocutor,
    };
  },

  /** Marca como leidos los mensajes recibidos y reinicia el contador. */
  async marcarComoLeidos(conversacionId, usuarioId) {
    const conversacion = await repositorioConversacion.buscarPorId(conversacionId);
    if (!conversacion) throw ErrorAplicacion.noEncontrado('La conversacion no existe.');

    const participa = conversacion.participantes.some(
      (participante) => String(participante._id) === String(usuarioId)
    );
    if (!participa) throw ErrorAplicacion.prohibido('No participas en esta conversacion.');

    await repositorioMensaje.marcarLeidos(conversacionId, usuarioId);
    await repositorioConversacion.reiniciarNoLeidos(conversacionId, usuarioId);

    const interlocutor = conversacion.participantes.find(
      (participante) => String(participante._id) !== String(usuarioId)
    );

    // Se avisa al emisor que sus mensajes fueron leidos.
    emitirMensajeLeido(interlocutor._id, { conversacionId: String(conversacionId), usuario: String(usuarioId) });

    const totalNoLeidos = await this.contarNoLeidosTotales(usuarioId);
    emitirContadorNoLeidasMensajes(usuarioId, totalNoLeidos);

    return { mensaje: 'Mensajes marcados como leidos.', noLeidos: totalNoLeidos };
  },

  /** Total de mensajes sin leer del usuario (badge del menu). */
  async contarNoLeidosTotales(usuarioId) {
    const resultado = await repositorioConversacion.contarNoLeidosTotales(usuarioId);
    return resultado.length > 0 ? resultado[0].total : 0;
  },

  /** Elimina una conversacion completa (solo sus mensajes). */
  async eliminarConversacion(conversacionId, usuarioId) {
    const conversacion = await repositorioConversacion.buscarPorId(conversacionId);
    if (!conversacion) throw ErrorAplicacion.noEncontrado('La conversacion no existe.');

    const participa = conversacion.participantes.some(
      (participante) => String(participante._id) === String(usuarioId)
    );
    if (!participa) throw ErrorAplicacion.prohibido('No participas en esta conversacion.');

    await Promise.all([
      repositorioMensaje.eliminarPorConversacion(conversacionId),
      repositorioConversacion.actualizarUltimoMensaje(conversacionId, null),
    ]);

    return { mensaje: 'Conversacion vaciada correctamente.' };
  },
};

module.exports = { servicioMensaje };
