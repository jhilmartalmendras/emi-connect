const Historia = require('../modelos/Historia');

const POPULATE_AUTOR = 'nombres apellidos fotoPerfil rol';

const repositorioHistoria = {
  crear(datos) {
    return Historia.create(datos);
  },

  buscarPorId(id) {
    return Historia.findById(id).populate('autor', POPULATE_AUTOR).exec();
  },

  /** Historias activas y no expiradas de un conjunto de usuarios. */
  listarActivasDe(autoresIds) {
    return Historia.find({
      autor: { $in: autoresIds },
      activa: true,
      expiraEn: { $gt: new Date() },
    })
      .sort({ fechaCreacion: -1 })
      .populate('autor', POPULATE_AUTOR)
      .lean()
      .exec();
  },

  registrarVisualizacion(id, usuarioId) {
    return Historia.findByIdAndUpdate(id, { $addToSet: { visualizaciones: usuarioId } }, { new: true }).exec();
  },

  marcarInactiva(id) {
    return Historia.findByIdAndUpdate(id, { activa: false }, { new: true }).exec();
  },

  eliminarPorId(id) {
    return Historia.findByIdAndDelete(id).exec();
  },

  eliminarDeUsuario(usuarioId) {
    return Historia.deleteMany({ autor: usuarioId }).exec();
  },

  contar(filtro = {}) {
    return Historia.countDocuments(filtro);
  },
};

module.exports = { repositorioHistoria };
