const Reporte = require('../modelos/Reporte');

const POPULATE_REPORTANTE = 'nombres apellidos correo fotoPerfil rol';
const POPULATE_REVISOR = 'nombres apellidos rol';

const repositorioReporte = {
  crear(datos) {
    return Reporte.create(datos);
  },

  buscarPorId(id) {
    return Reporte.findById(id)
      .populate('reportante', POPULATE_REPORTANTE)
      .populate('revisadoPor', POPULATE_REVISOR)
      .exec();
  },

  buscarExistente({ reportante, objetivo, tipo }) {
    return Reporte.findOne({ reportante, objetivo, tipo }).lean().exec();
  },

  listar({ filtro = {}, saltar = 0, limite = 20, orden = { fechaCreacion: -1 } }) {
    return Reporte.find(filtro)
      .sort(orden)
      .skip(saltar)
      .limit(limite)
      .populate('reportante', POPULATE_REPORTANTE)
      .populate('revisadoPor', POPULATE_REVISOR)
      .lean()
      .exec();
  },

  actualizarPorId(id, cambios) {
    return Reporte.findByIdAndUpdate(id, cambios, { new: true, runValidators: true })
      .populate('reportante', POPULATE_REPORTANTE)
      .populate('revisadoPor', POPULATE_REVISOR)
      .exec();
  },

  contar(filtro = {}) {
    return Reporte.countDocuments(filtro);
  },

  contarPorEstado() {
    return Reporte.aggregate([
      { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
    ]).exec();
  },

  contarDesde(desde) {
    return Reporte.countDocuments({ fechaCreacion: { $gte: desde } });
  },

  eliminarPorObjetivo(objetivo) {
    return Reporte.deleteMany({ objetivo }).exec();
  },
};

module.exports = { repositorioReporte };
