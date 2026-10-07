const Comunidad = require('../modelos/Comunidad');
const { escaparExpresionRegular } = require('../utilidades/paginacion');

const POPULATE_CREADOR = { path: 'creador', select: 'nombres apellidos fotoPerfil rol verificado' };

const repositorioComunidad = {
  crear(datos) {
    return Comunidad.create(datos);
  },

  buscarPorId(id) {
    return Comunidad.findById(id).populate(POPULATE_CREADOR).exec();
  },

  listar({ filtro = {}, saltar = 0, limite = 12, orden = { cantidadMiembros: -1, fechaCreacion: -1 } }) {
    return Comunidad.find({ activa: true, ...filtro })
      .sort(orden)
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_CREADOR)
      .lean()
      .exec();
  },

  listarPorIds(ids, { saltar = 0, limite = 20 } = {}) {
    return Comunidad.find({ _id: { $in: ids }, activa: true })
      .sort({ cantidadMiembros: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_CREADOR)
      .lean()
      .exec();
  },

  buscarPorTexto(texto, { filtro = {}, saltar = 0, limite = 10 } = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Comunidad.find({
      ...filtro,
      activa: true,
      $or: [{ nombre: patron }, { descripcion: patron }, { categoria: patron }],
    })
      .sort({ cantidadMiembros: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_CREADOR)
      .lean()
      .exec();
  },

  contarBusqueda(texto, filtro = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Comunidad.countDocuments({
      ...filtro,
      activa: true,
      $or: [{ nombre: patron }, { descripcion: patron }, { categoria: patron }],
    });
  },

  actualizarPorId(id, cambios) {
    return Comunidad.findByIdAndUpdate(id, cambios, { new: true, runValidators: true })
      .populate(POPULATE_CREADOR)
      .exec();
  },

  incrementarCampos(id, incrementos) {
    return Comunidad.findByIdAndUpdate(id, { $inc: incrementos }, { new: true }).exec();
  },

  eliminarPorId(id) {
    return Comunidad.findByIdAndDelete(id).exec();
  },

  contar(filtro = {}) {
    return Comunidad.countDocuments({ activa: true, ...filtro });
  },

  /** Comunidades recomendadas por categoria o afinidad de intereses. */
  listarSugeridas({ excluirIds = [], categoria, limite = 6 }) {
    const filtro = { activa: true, _id: { $nin: excluirIds } };
    if (categoria) filtro.$or = [{ categoria }, { categoria: 'general' }];
    return Comunidad.find(filtro).sort({ cantidadMiembros: -1 }).limit(limite).lean().exec();
  },

  listarRecientes(limite = 5) {
    return Comunidad.find({ activa: true })
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .populate(POPULATE_CREADOR)
      .lean()
      .exec();
  },

  contarDesde(desde) {
    return Comunidad.countDocuments({ fechaCreacion: { $gte: desde }, activa: true });
  },
};

module.exports = { repositorioComunidad };
