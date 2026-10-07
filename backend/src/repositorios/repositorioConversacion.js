const Conversacion = require('../modelos/Conversacion');

const POPULATE_PARTICIPANTES =
  'nombres apellidos correo rol carrera semestre fotoPerfil verificado fechaUltimaConexion';

const repositorioConversacion = {
  crear(participantes) {
    return Conversacion.create({ participantes, noLeidos: participantes.map((usuario) => ({ usuario, cantidad: 0 })) });
  },

  buscarPorId(id) {
    return Conversacion.findById(id)
      .populate('participantes', POPULATE_PARTICIPANTES)
      .populate({ path: 'ultimoMensaje', populate: { path: 'emisor', select: 'nombres apellidos' } })
      .exec();
  },

  /** Busca la conversacion uno a uno entre dos usuarios. */
  buscarEntreDos(usuarioA, usuarioB) {
    return Conversacion.findOne({ participantes: { $all: [usuarioA, usuarioB] } }).exec();
  },

  listarPorUsuario(usuarioId, { saltar = 0, limite = 30 } = {}) {
    return Conversacion.find({ participantes: usuarioId, activa: true })
      .sort({ fechaUltimoMensaje: -1 })
      .skip(saltar)
      .limit(limite)
      .populate('participantes', POPULATE_PARTICIPANTES)
      .populate({ path: 'ultimoMensaje', populate: { path: 'emisor', select: 'nombres apellidos' } })
      .lean()
      .exec();
  },

  contarPorUsuario(usuarioId) {
    return Conversacion.countDocuments({ participantes: usuarioId, activa: true });
  },

  actualizarUltimoMensaje(conversacionId, mensajeId) {
    return Conversacion.findByIdAndUpdate(
      conversacionId,
      { ultimoMensaje: mensajeId, fechaUltimoMensaje: new Date() },
      { new: true }
    ).exec();
  },

  /** Incrementa el contador de no leidos del receptor. */
  incrementarNoLeidos(conversacionId, usuarioId, cantidad = 1) {
    return Conversacion.findOneAndUpdate(
      { _id: conversacionId, 'noLeidos.usuario': usuarioId },
      { $inc: { 'noLeidos.$.cantidad': cantidad } },
      { new: true }
    ).exec();
  },

  reiniciarNoLeidos(conversacionId, usuarioId) {
    return Conversacion.findOneAndUpdate(
      { _id: conversacionId, 'noLeidos.usuario': usuarioId },
      { $set: { 'noLeidos.$.cantidad': 0 } },
      { new: true }
    ).exec();
  },

  contarNoLeidosTotales(usuarioId) {
    return Conversacion.aggregate([
      { $match: { participantes: usuarioId } },
      { $unwind: '$noLeidos' },
      { $match: { 'noLeidos.usuario': usuarioId } },
      { $group: { _id: null, total: { $sum: '$noLeidos.cantidad' } } },
    ]).exec();
  },

  eliminarPorUsuario(usuarioId) {
    return Conversacion.deleteMany({ participantes: usuarioId }).exec();
  },

  contar(filtro = {}) {
    return Conversacion.countDocuments(filtro);
  },
};

module.exports = { repositorioConversacion };
