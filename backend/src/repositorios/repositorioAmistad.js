const Amistad = require('../modelos/Amistad');

const POPULATE_USUARIO = 'nombres apellidos correo rol carrera semestre fotoPerfil verificado';

const repositorioAmistad = {
  crear(datos) {
    return Amistad.create(datos);
  },

  buscarPorId(id) {
    return Amistad.findById(id)
      .populate('solicitante', POPULATE_USUARIO)
      .populate('receptor', POPULATE_USUARIO)
      .exec();
  },

  /** Busca la relacion existente en cualquier direccion entre dos usuarios. */
  buscarEntreDos(usuarioA, usuarioB) {
    return Amistad.findOne({
      $or: [
        { solicitante: usuarioA, receptor: usuarioB },
        { solicitante: usuarioB, receptor: usuarioA },
      ],
    }).exec();
  },

  listarSolicitudesRecibidas(usuarioId, { estado = 'pendiente', saltar = 0, limite = 20 } = {}) {
    return Amistad.find({ receptor: usuarioId, estado })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate('solicitante', POPULATE_USUARIO)
      .lean()
      .exec();
  },

  listarSolicitudesEnviadas(usuarioId, { estado = 'pendiente', saltar = 0, limite = 20 } = {}) {
    return Amistad.find({ solicitante: usuarioId, estado })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate('receptor', POPULATE_USUARIO)
      .lean()
      .exec();
  },

  /** Todas las relaciones aceptadas de un usuario (amigos). */
  listarAceptadas(usuarioId, { saltar = 0, limite = 50 } = {}) {
    return Amistad.find({
      estado: 'aceptada',
      $or: [{ solicitante: usuarioId }, { receptor: usuarioId }],
    })
      .sort({ fechaActualizacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate('solicitante', POPULATE_USUARIO)
      .populate('receptor', POPULATE_USUARIO)
      .lean()
      .exec();
  },

  contarAceptadas(usuarioId) {
    return Amistad.countDocuments({
      estado: 'aceptada',
      $or: [{ solicitante: usuarioId }, { receptor: usuarioId }],
    });
  },

  contarPendientes(usuarioId) {
    return Amistad.countDocuments({ receptor: usuarioId, estado: 'pendiente' });
  },

  listarIdsRelacionados(usuarioId, estado = 'aceptada') {
    return Amistad.find({
      estado,
      $or: [{ solicitante: usuarioId }, { receptor: usuarioId }],
    })
      .select('solicitante receptor')
      .lean()
      .exec();
  },

  actualizarPorId(id, cambios) {
    return Amistad.findByIdAndUpdate(id, cambios, { new: true }).exec();
  },

  eliminarPorId(id) {
    return Amistad.findByIdAndDelete(id).exec();
  },

  /** Elimina todas las relaciones (en cualquier direccion) de un usuario. */
  eliminarDeUsuario(usuarioId) {
    return Amistad.deleteMany({
      $or: [{ solicitante: usuarioId }, { receptor: usuarioId }],
    }).exec();
  },

  eliminarEntreDos(usuarioA, usuarioB) {
    return Amistad.deleteMany({
      $or: [
        { solicitante: usuarioA, receptor: usuarioB },
        { solicitante: usuarioB, receptor: usuarioA },
      ],
    }).exec();
  },

  contar() {
    return Amistad.countDocuments({ estado: 'aceptada' });
  },
};

module.exports = { repositorioAmistad };
