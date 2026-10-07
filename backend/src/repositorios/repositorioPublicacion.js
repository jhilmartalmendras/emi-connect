const Publicacion = require('../modelos/Publicacion');
const { escaparExpresionRegular } = require('../utilidades/paginacion');

// Campos que se completan al consultar publicaciones para evitar N+1 queries.
const POPULATE_AUTOR = { path: 'autor', select: 'nombres apellidos correo rol carrera fotoPerfil verificado' };
const POPULATE_ORIGINAL = {
  path: 'publicacionOriginal',
  select: 'contenido imagenes autor categoria fechaCreacion esInstitucional eliminado',
  populate: { path: 'autor', select: 'nombres apellidos fotoPerfil rol verificado' },
};
const POPULATE_COMUNIDAD = { path: 'comunidad', select: 'nombre imagen' };
const POPULATE_EVENTO = { path: 'evento', select: 'nombre fecha ubicacion' };
const POPULATE_PRODUCTO = { path: 'producto', select: 'titulo precio imagenes' };

const repositorioPublicacion = {
  crear(datos) {
    return Publicacion.create(datos);
  },

  buscarPorId(id, completo = true) {
    let consulta = Publicacion.findById(id);
    if (completo) {
      consulta = consulta
        .populate(POPULATE_AUTOR)
        .populate(POPULATE_ORIGINAL)
        .populate(POPULATE_COMUNIDAD)
        .populate(POPULATE_EVENTO)
        .populate(POPULATE_PRODUCTO);
    }
    return consulta.exec();
  },

  listar({ filtro = {}, saltar = 0, limite = 10, orden = { fechaCreacion: -1 } }) {
    return Publicacion.find({ eliminado: false, ...filtro })
      .sort(orden)
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .populate(POPULATE_ORIGINAL)
      .populate(POPULATE_COMUNIDAD)
      .populate(POPULATE_EVENTO)
      .populate(POPULATE_PRODUCTO)
      .lean()
      .exec();
  },

  /** Feed principal: autores seguidos (amigos), comunidades y publicaciones propias. */
  listarFeed({ usuariosIds = [], comunidadesIds = [], saltar = 0, limite = 10 }) {
    const condiciones = [
      { eliminado: false },
      { visible: true },
      {
        $or: [
          { autor: { $in: usuariosIds } },
          { comunidad: { $in: comunidadesIds } },
          { categoria: 'institucional' },
        ],
      },
    ];

    return Publicacion.find({ $and: condiciones })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .populate(POPULATE_ORIGINAL)
      .populate(POPULATE_COMUNIDAD)
      .populate(POPULATE_EVENTO)
      .populate(POPULATE_PRODUCTO)
      .lean()
      .exec();
  },

  contarFeed({ usuariosIds = [], comunidadesIds = [] }) {
    return Publicacion.countDocuments({
      $and: [
        { eliminado: false },
        { visible: true },
        {
          $or: [
            { autor: { $in: usuariosIds } },
            { comunidad: { $in: comunidadesIds } },
            { categoria: 'institucional' },
          ],
        },
      ],
    });
  },

  listarPorAutor(autorId, { saltar = 0, limite = 10 }) {
    return Publicacion.find({ autor: autorId, eliminado: false })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .populate(POPULATE_ORIGINAL)
      .populate(POPULATE_COMUNIDAD)
      .lean()
      .exec();
  },

  contarPorAutor(autorId) {
    return Publicacion.countDocuments({ autor: autorId, eliminado: false });
  },

  listarPorComunidad(comunidadId, { saltar = 0, limite = 10 }) {
    return Publicacion.find({ comunidad: comunidadId, eliminado: false })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .populate(POPULATE_ORIGINAL)
      .populate(POPULATE_COMUNIDAD)
      .lean()
      .exec();
  },

  listarPorCategoria(categoria, { saltar = 0, limite = 10 }) {
    return Publicacion.find({ categoria, eliminado: false })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .lean()
      .exec();
  },

  /** Publicaciones guardadas por un usuario usando agregacion (una sola consulta). */
  listarGuardadas(idsPublicaciones, { saltar = 0, limite = 10 }) {
    return Publicacion.find({ _id: { $in: idsPublicaciones }, eliminado: false })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .populate(POPULATE_ORIGINAL)
      .populate(POPULATE_COMUNIDAD)
      .lean()
      .exec();
  },

  buscarPorTexto(texto, { filtro = {}, saltar = 0, limite = 10 } = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Publicacion.find({ ...filtro, eliminado: false, contenido: patron })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .lean()
      .exec();
  },

  contarBusqueda(texto, filtro = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Publicacion.countDocuments({ ...filtro, eliminado: false, contenido: patron });
  },

  actualizarPorId(id, cambios) {
    return Publicacion.findByIdAndUpdate(id, cambios, { new: true, runValidators: true })
      .populate(POPULATE_AUTOR)
      .exec();
  },

  incrementarCampos(id, incrementos) {
    return Publicacion.findByIdAndUpdate(id, { $inc: incrementos }, { new: true }).exec();
  },

  /** Eliminacion logica: el contenido se conserva para auditoria y restauracion. */
  marcarEliminada(id, { eliminadoPor = null, motivo = '' } = {}) {
    return Publicacion.findByIdAndUpdate(
      id,
      { eliminado: true, visible: false, eliminadoPor, motivoEliminacion: motivo },
      { new: true }
    ).exec();
  },

  restaurar(id) {
    return Publicacion.findByIdAndUpdate(
      id,
      { eliminado: false, visible: true, eliminadoPor: null, motivoEliminacion: '' },
      { new: true }
    ).exec();
  },

  eliminarPorId(id) {
    return Publicacion.findByIdAndDelete(id).exec();
  },

  /** Eliminacion logica de todas las publicaciones de un autor. */
  marcarEliminadasPorAutor(autorId) {
    return Publicacion.updateMany({ autor: autorId }, { eliminado: true, visible: false }).exec();
  },

  eliminarPorAutor(autorId) {
    return Publicacion.deleteMany({ autor: autorId }).exec();
  },

  eliminarPorComunidad(comunidadId) {
    return Publicacion.deleteMany({ comunidad: comunidadId }).exec();
  },

  contar(filtro = {}) {
    return Publicacion.countDocuments({ eliminado: false, ...filtro });
  },

  /** Listado para el panel administrativo: incluye publicaciones eliminadas. */
  listarAdmin({ filtro = {}, saltar = 0, limite = 20, orden = { fechaCreacion: -1 } }) {
    return Publicacion.find(filtro)
      .sort(orden)
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_AUTOR)
      .populate(POPULATE_COMUNIDAD)
      .lean()
      .exec();
  },

  contarAdmin(filtro = {}) {
    return Publicacion.countDocuments(filtro);
  },

  contarRango(desde) {
    return Publicacion.countDocuments({ fechaCreacion: { $gte: desde }, eliminado: false });
  },

  contarPorDia(desde) {
    return Publicacion.aggregate([
      { $match: { fechaCreacion: { $gte: desde }, eliminado: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaCreacion' } },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();
  },

  contarPorCategoria() {
    return Publicacion.aggregate([
      { $match: { eliminado: false } },
      { $group: { _id: '$categoria', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
    ]).exec();
  },
};

module.exports = { repositorioPublicacion };
