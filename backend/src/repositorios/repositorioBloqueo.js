const Bloqueo = require('../modelos/Bloqueo');

const POPULATE_USUARIO = 'nombres apellidos correo rol carrera fotoPerfil';

const repositorioBloqueo = {
  crear(datos) {
    return Bloqueo.findOneAndUpdate(
      { quienBloquea: datos.quienBloquea, bloqueado: datos.bloqueado },
      datos,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },

  buscar({ quienBloquea, bloqueado }) {
    return Bloqueo.findOne({ quienBloquea, bloqueado }).lean().exec();
  },

  /** Verifica si existe bloqueo en cualquier direccion. */
  existeBloqueoEntre(usuarioA, usuarioB) {
    return Bloqueo.findOne({
      $or: [
        { quienBloquea: usuarioA, bloqueado: usuarioB },
        { quienBloquea: usuarioB, bloqueado: usuarioA },
      ],
    })
      .lean()
      .exec();
  },

  listarBloqueadosPor(usuarioId) {
    return Bloqueo.find({ quienBloquea: usuarioId })
      .sort({ fechaCreacion: -1 })
      .populate('bloqueado', POPULATE_USUARIO)
      .lean()
      .exec();
  },

  listarQuienesBloquearon(usuarioId) {
    return Bloqueo.find({ bloqueado: usuarioId }).select('quienBloquea').lean().exec();
  },

  /** Identificadores de usuarios que bloquean a este usuario (filtro del feed). */
  idsQueBloquearon(usuarioId) {
    return Bloqueo.find({ bloqueado: usuarioId }).select('quienBloquea').lean().exec();
  },

  eliminar({ quienBloquea, bloqueado }) {
    return Bloqueo.findOneAndDelete({ quienBloquea, bloqueado }).exec();
  },

  eliminarTodosDeUsuario(usuarioId) {
    return Bloqueo.deleteMany({
      $or: [{ quienBloquea: usuarioId }, { bloqueado: usuarioId }],
    }).exec();
  },

  contar() {
    return Bloqueo.countDocuments();
  },
};

module.exports = { repositorioBloqueo };
