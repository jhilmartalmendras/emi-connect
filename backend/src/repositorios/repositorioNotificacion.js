const Notificacion = require('../modelos/Notificacion');

const POPULATE_ACTOR = 'nombres apellidos fotoPerfil rol';

const repositorioNotificacion = {
  crear(datos) {
    return Notificacion.create(datos);
  },

  crearVarias(documentos) {
    return Notificacion.insertMany(documentos);
  },

  listarPorUsuario(usuarioId, { soloNoLeidas = false, saltar = 0, limite = 20 } = {}) {
    const filtro = { usuario: usuarioId };
    if (soloNoLeidas) filtro.leida = false;

    return Notificacion.find(filtro)
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate('actor', POPULATE_ACTOR)
      .lean()
      .exec();
  },

  contarNoLeidas(usuarioId) {
    return Notificacion.countDocuments({ usuario: usuarioId, leida: false });
  },

  contar(usuarioId) {
    return Notificacion.countDocuments({ usuario: usuarioId });
  },

  marcarLeida(id, usuarioId) {
    return Notificacion.findOneAndUpdate(
      { _id: id, usuario: usuarioId },
      { leida: true, fechaLectura: new Date() },
      { new: true }
    ).exec();
  },

  marcarTodasLeidas(usuarioId) {
    return Notificacion.updateMany(
      { usuario: usuarioId, leida: false },
      { leida: true, fechaLectura: new Date() }
    ).exec();
  },

  eliminarPorId(id, usuarioId) {
    return Notificacion.findOneAndDelete({ _id: id, usuario: usuarioId }).exec();
  },

  eliminarPorUsuario(usuarioId) {
    return Notificacion.deleteMany({ usuario: usuarioId }).exec();
  },

  eliminarPorReferencia(campo, valor) {
    return Notificacion.deleteMany({ [campo]: valor }).exec();
  },
};

module.exports = { repositorioNotificacion };
