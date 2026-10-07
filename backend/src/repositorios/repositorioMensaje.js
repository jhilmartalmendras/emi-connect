const Mensaje = require('../modelos/Mensaje');

const repositorioMensaje = {
  crear(datos) {
    return Mensaje.create(datos);
  },

  buscarPorId(id) {
    return Mensaje.findById(id)
      .populate('emisor', 'nombres apellidos fotoPerfil')
      .populate('conversacion')
      .exec();
  },

  /** Mensajes de una conversacion ordenados del mas reciente al mas antiguo. */
  listarPorConversacion(conversacionId, { saltar = 0, limite = 30 } = {}) {
    return Mensaje.find({ conversacion: conversacionId, eliminado: false })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate('emisor', 'nombres apellidos fotoPerfil')
      .lean()
      .exec();
  },

  contarPorConversacion(conversacionId) {
    return Mensaje.countDocuments({ conversacion: conversacionId, eliminado: false });
  },

  /** Marca como leidos todos los mensajes no leidos de la otra parte del chat. */
  marcarLeidos(conversacionId, usuarioReceptor) {
    return Mensaje.updateMany(
      { conversacion: conversacionId, emisor: { $ne: usuarioReceptor }, leido: false },
      { leido: true, fechaLectura: new Date() }
    ).exec();
  },

  eliminarPorConversacion(conversacionId) {
    return Mensaje.deleteMany({ conversacion: conversacionId }).exec();
  },

  contar(filtro = {}) {
    return Mensaje.countDocuments(filtro);
  },

  contarDesde(desde) {
    return Mensaje.countDocuments({ fechaCreacion: { $gte: desde } });
  },
};

module.exports = { repositorioMensaje };
