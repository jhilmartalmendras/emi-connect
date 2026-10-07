const AsistenciaEvento = require('../modelos/AsistenciaEvento');

const POPULATE_USUARIO = 'nombres apellidos correo carrera fotoPerfil verificado';

const repositorioAsistenciaEvento = {
  crearOActualizar({ evento, usuario, estado }) {
    return AsistenciaEvento.findOneAndUpdate(
      { evento, usuario },
      { evento, usuario, estado, fechaConfirmacion: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },

  buscar({ evento, usuario }) {
    return AsistenciaEvento.findOne({ evento, usuario }).lean().exec();
  },

  listarPorEvento(eventoId, { estado, saltar = 0, limite = 50 } = {}) {
    const filtro = { evento: eventoId };
    if (estado) filtro.estado = estado;
    return AsistenciaEvento.find(filtro)
      .sort({ fechaConfirmacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate('usuario', POPULATE_USUARIO)
      .lean()
      .exec();
  },

  listarEventosDeUsuario(usuarioId, eventosIds) {
    return AsistenciaEvento.find({ usuario: usuarioId, evento: { $in: eventosIds } }).lean().exec();
  },

  /** Todas las asistencias registradas por un usuario. */
  listarPorUsuario(usuarioId, { saltar = 0, limite = 100 } = {}) {
    return AsistenciaEvento.find({ usuario: usuarioId })
      .sort({ fechaConfirmacion: -1 })
      .skip(saltar)
      .limit(limite)
      .lean()
      .exec();
  },

  eliminarPorEvento(eventoId) {
    return AsistenciaEvento.deleteMany({ evento: eventoId }).exec();
  },

  eliminar({ evento, usuario }) {
    return AsistenciaEvento.findOneAndDelete({ evento, usuario }).exec();
  },

  contar(filtro = {}) {
    return AsistenciaEvento.countDocuments(filtro);
  },
};

module.exports = { repositorioAsistenciaEvento };
