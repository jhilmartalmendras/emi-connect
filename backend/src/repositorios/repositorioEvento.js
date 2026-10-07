const Evento = require('../modelos/Evento');
const { escaparExpresionRegular } = require('../utilidades/paginacion');

const POPULATE_ORGANIZADOR = {
  path: 'organizador',
  select: 'nombres apellidos fotoPerfil rol verificado',
};
const POPULATE_COMUNIDAD = { path: 'comunidad', select: 'nombre imagen' };

const repositorioEvento = {
  crear(datos) {
    return Evento.create(datos);
  },

  buscarPorId(id) {
    return Evento.findById(id).populate(POPULATE_ORGANIZADOR).populate(POPULATE_COMUNIDAD).exec();
  },

  listar({ filtro = {}, saltar = 0, limite = 12, orden = { fecha: 1 } }) {
    return Evento.find({ activo: true, ...filtro })
      .sort(orden)
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_ORGANIZADOR)
      .populate(POPULATE_COMUNIDAD)
      .lean()
      .exec();
  },

  /** Eventos proximos a partir de una fecha. */
  listarProximos({ desde = new Date(), filtro = {}, saltar = 0, limite = 10 } = {}) {
    return Evento.find({ activo: true, cancelado: false, fecha: { $gte: desde }, ...filtro })
      .sort({ fecha: 1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_ORGANIZADOR)
      .populate(POPULATE_COMUNIDAD)
      .lean()
      .exec();
  },

  buscarPorTexto(texto, { filtro = {}, saltar = 0, limite = 10 } = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Evento.find({
      ...filtro,
      activo: true,
      $or: [{ nombre: patron }, { descripcion: patron }, { ubicacion: patron }],
    })
      .sort({ fecha: 1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_ORGANIZADOR)
      .lean()
      .exec();
  },

  contarBusqueda(texto, filtro = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Evento.countDocuments({
      ...filtro,
      activo: true,
      $or: [{ nombre: patron }, { descripcion: patron }, { ubicacion: patron }],
    });
  },

  actualizarPorId(id, cambios) {
    return Evento.findByIdAndUpdate(id, cambios, { new: true, runValidators: true })
      .populate(POPULATE_ORGANIZADOR)
      .exec();
  },

  incrementarCampos(id, incrementos) {
    return Evento.findByIdAndUpdate(id, { $inc: incrementos }, { new: true }).exec();
  },

  eliminarPorId(id) {
    return Evento.findByIdAndDelete(id).exec();
  },

  contar(filtro = {}) {
    return Evento.countDocuments({ activo: true, ...filtro });
  },

  contarDesde(desde) {
    return Evento.countDocuments({ fechaCreacion: { $gte: desde }, activo: true });
  },

  listarRecientes(limite = 5) {
    return Evento.find({ activo: true })
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .populate(POPULATE_ORGANIZADOR)
      .lean()
      .exec();
  },
};

module.exports = { repositorioEvento };
