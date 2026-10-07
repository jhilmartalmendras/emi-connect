const MiembroComunidad = require('../modelos/MiembroComunidad');

const POPULATE_USUARIO = 'nombres apellidos correo rol carrera semestre fotoPerfil verificado';

const repositorioMiembroComunidad = {
  crear(datos) {
    return MiembroComunidad.create(datos);
  },

  buscar({ comunidad, usuario }) {
    return MiembroComunidad.findOne({ comunidad, usuario }).lean().exec();
  },

  buscarPorId(id) {
    return MiembroComunidad.findById(id).populate('usuario', POPULATE_USUARIO).exec();
  },

  listarMiembros(comunidadId, { estado = 'activo', saltar = 0, limite = 50 } = {}) {
    return MiembroComunidad.find({ comunidad: comunidadId, estado })
      .sort({ rol: 1, fechaCreacion: 1 })
      .skip(saltar)
      .limit(limite)
      .populate('usuario', POPULATE_USUARIO)
      .lean()
      .exec();
  },

  contarMiembros(comunidadId, estado = 'activo') {
    return MiembroComunidad.countDocuments({ comunidad: comunidadId, estado });
  },

  /** Comunidades a las que pertenece un usuario. */
  listarComunidadesDeUsuario(usuarioId, { estado = 'activo', saltar = 0, limite = 20 } = {}) {
    return MiembroComunidad.find({ usuario: usuarioId, estado })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate({
        path: 'comunidad',
        select: 'nombre descripcion imagen portada cantidadMiembros categoria',
      })
      .lean()
      .exec();
  },

  listarIdsComunidadesDeUsuario(usuarioId, estado = 'activo') {
    return MiembroComunidad.find({ usuario: usuarioId, estado }).select('comunidad').lean().exec();
  },

  actualizarPorId(id, cambios) {
    return MiembroComunidad.findByIdAndUpdate(id, cambios, { new: true }).exec();
  },

  eliminar({ comunidad, usuario }) {
    return MiembroComunidad.findOneAndDelete({ comunidad, usuario }).exec();
  },

  eliminarPorComunidad(comunidadId) {
    return MiembroComunidad.deleteMany({ comunidad: comunidadId }).exec();
  },

  eliminarPorUsuario(usuarioId) {
    return MiembroComunidad.deleteMany({ usuario: usuarioId }).exec();
  },

  contar(filtro = {}) {
    return MiembroComunidad.countDocuments(filtro);
  },
};

module.exports = { repositorioMiembroComunidad };
