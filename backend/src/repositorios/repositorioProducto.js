const Producto = require('../modelos/Producto');
const { escaparExpresionRegular } = require('../utilidades/paginacion');

const POPULATE_VENDEDOR = {
  path: 'vendedor',
  select: 'nombres apellidos carrera fotoPerfil rol verificado',
};

const repositorioProducto = {
  crear(datos) {
    return Producto.create(datos);
  },

  buscarPorId(id) {
    return Producto.findById(id).populate(POPULATE_VENDEDOR).exec();
  },

  listar({ filtro = {}, saltar = 0, limite = 12, orden = { fechaCreacion: -1 } }) {
    return Producto.find({ activo: true, ...filtro })
      .sort(orden)
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_VENDEDOR)
      .lean()
      .exec();
  },

  listarPorVendedor(vendedorId, { saltar = 0, limite = 12 } = {}) {
    return Producto.find({ vendedor: vendedorId, activo: true })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_VENDEDOR)
      .lean()
      .exec();
  },

  contarPorVendedor(vendedorId) {
    return Producto.countDocuments({ vendedor: vendedorId, activo: true });
  },

  buscarPorTexto(texto, { filtro = {}, saltar = 0, limite = 12 } = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Producto.find({
      ...filtro,
      activo: true,
      $or: [{ titulo: patron }, { descripcion: patron }, { categoria: patron }],
    })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .populate(POPULATE_VENDEDOR)
      .lean()
      .exec();
  },

  contarBusqueda(texto, filtro = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Producto.countDocuments({
      ...filtro,
      activo: true,
      $or: [{ titulo: patron }, { descripcion: patron }, { categoria: patron }],
    });
  },

  actualizarPorId(id, cambios) {
    return Producto.findByIdAndUpdate(id, cambios, { new: true, runValidators: true })
      .populate(POPULATE_VENDEDOR)
      .exec();
  },

  incrementarCampos(id, incrementos) {
    return Producto.findByIdAndUpdate(id, { $inc: incrementos }, { new: true }).exec();
  },

  eliminarPorId(id) {
    return Producto.findByIdAndDelete(id).exec();
  },

  contar(filtro = {}) {
    return Producto.countDocuments({ activo: true, ...filtro });
  },

  contarDesde(desde) {
    return Producto.countDocuments({ fechaCreacion: { $gte: desde }, activo: true });
  },

  listarRecientes(limite = 5) {
    return Producto.find({ activo: true })
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .populate(POPULATE_VENDEDOR)
      .lean()
      .exec();
  },
};

module.exports = { repositorioProducto };
