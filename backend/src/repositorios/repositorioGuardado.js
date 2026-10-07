const PublicacionGuardada = require('../modelos/PublicacionGuardada');

const repositorioGuardado = {
  crear({ usuario, publicacion, etiquetaPersonal = '' }) {
    return PublicacionGuardada.findOneAndUpdate(
      { usuario, publicacion },
      { usuario, publicacion, etiquetaPersonal },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },

  buscar({ usuario, publicacion }) {
    return PublicacionGuardada.findOne({ usuario, publicacion }).lean().exec();
  },

  listarPorUsuario(usuarioId, { saltar = 0, limite = 20 } = {}) {
    return PublicacionGuardada.find({ usuario: usuarioId })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .lean()
      .exec();
  },

  listarIdsPublicaciones(usuarioId) {
    return PublicacionGuardada.find({ usuario: usuarioId }).select('publicacion').lean().exec();
  },

  contar(usuarioId) {
    return PublicacionGuardada.countDocuments({ usuario: usuarioId });
  },

  eliminar({ usuario, publicacion }) {
    return PublicacionGuardada.findOneAndDelete({ usuario, publicacion }).exec();
  },

  eliminarPorPublicacion(publicacionId) {
    return PublicacionGuardada.deleteMany({ publicacion: publicacionId }).exec();
  },
};

module.exports = { repositorioGuardado };
