const Comentario = require('../modelos/Comentario');

const POPULATE_AUTOR = {
  path: 'autor',
  select: 'nombres apellidos correo rol carrera fotoPerfil verificado',
};

const repositorioComentario = {
  crear(datos) {
    return Comentario.create(datos);
  },

  buscarPorId(id) {
    return Comentario.findById(id).populate(POPULATE_AUTOR).exec();
  },

  listarPorPublicacion(publicacionId, { saltar = 0, limite = 20, incluirEliminados = false } = {}) {
    const filtro = { publicacion: publicacionId, comentarioPadre: null };
    if (!incluirEliminados) filtro.eliminado = false;

    return Comentario.find(filtro)
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .lean()
      .exec();
  },

  contarPorPublicacion(publicacionId) {
    return Comentario.countDocuments({ publicacion: publicacionId, eliminado: false });
  },

  /** Respuestas de un conjunto de comentarios en una sola consulta (evita N+1). */
  listarRespuestasDe(padresIds) {
    return Comentario.find({ comentarioPadre: { $in: padresIds }, eliminado: false })
      .sort({ fechaCreacion: 1 })
      .populate(POPULATE_AUTOR)
      .lean()
      .exec();
  },

  listarRespuestas(comentarioPadreId) {
    return Comentario.find({ comentarioPadre: comentarioPadreId, eliminado: false })
      .sort({ fechaCreacion: 1 })
      .populate(POPULATE_AUTOR)
      .lean()
      .exec();
  },

  actualizarPorId(id, cambios) {
    return Comentario.findByIdAndUpdate(id, cambios, { new: true, runValidators: true })
      .populate(POPULATE_AUTOR)
      .exec();
  },

  incrementarCampos(id, incrementos) {
    return Comentario.findByIdAndUpdate(id, { $inc: incrementos }, { new: true }).exec();
  },

  marcarEliminado(id) {
    return Comentario.findByIdAndUpdate(id, { eliminado: true, contenido: '' }, { new: true }).exec();
  },

  eliminarPorId(id) {
    return Comentario.findByIdAndDelete(id).exec();
  },

  eliminarPorPublicacion(publicacionId) {
    return Comentario.deleteMany({ publicacion: publicacionId }).exec();
  },

  eliminarPorAutor(autorId) {
    return Comentario.deleteMany({ autor: autorId }).exec();
  },

  contar(filtro = {}) {
    return Comentario.countDocuments({ eliminado: false, ...filtro });
  },

  contarDesde(desde) {
    return Comentario.countDocuments({ fechaCreacion: { $gte: desde }, eliminado: false });
  },
};

module.exports = { repositorioComentario };
