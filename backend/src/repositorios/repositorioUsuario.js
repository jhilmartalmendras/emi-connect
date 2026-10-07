const Usuario = require('../modelos/Usuario');
const { escaparExpresionRegular } = require('../utilidades/paginacion');

/**
 * Repositorio de usuarios.
 * Toda consulta a la coleccion "usuarios" pasa por aqui: los servicios no
 * conocen Mongoose y los controladores no ejecutan consultas.
 */
const repositorioUsuario = {
  crear(datos) {
    return Usuario.create(datos);
  },

  buscarPorCorreo(correo, incluirContrasena = false) {
    const consulta = Usuario.findOne({ correo: String(correo).toLowerCase().trim() });
    if (incluirContrasena) consulta.select('+contrasena');
    return consulta.exec();
  },

  buscarPorId(id, incluirContrasena = false) {
    const consulta = Usuario.findById(id);
    if (incluirContrasena) consulta.select('+contrasena');
    return consulta.exec();
  },

  buscarPorIds(ids) {
    return Usuario.find({ _id: { $in: ids } }).exec();
  },

  listar({ filtro = {}, saltar = 0, limite = 10, orden = { fechaCreacion: -1 } }) {
    return Usuario.find(filtro).sort(orden).skip(saltar).limit(limite).lean().exec();
  },

  contar(filtro = {}) {
    return Usuario.countDocuments(filtro);
  },

  /** Busca usuarios por nombres, apellidos, carrera o intereses. */
  buscarPorTexto(texto, { filtro = {}, saltar = 0, limite = 10 } = {}) {
    const patron = new RegExp(escaparExpresionRegular(texto), 'i');
    return Usuario.find({
      ...filtro,
      $or: [
        { nombres: patron },
        { apellidos: patron },
        { carrera: patron },
        { intereses: patron },
        { unidadAcademica: patron },
      ],
    })
      .sort({ cantidadAmigos: -1, fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .lean()
      .exec();
  },

  actualizarPorId(id, cambios, opciones = { new: true, runValidators: true }) {
    return Usuario.findByIdAndUpdate(id, cambios, opciones).exec();
  },

  incrementarCampos(id, incrementos) {
    return Usuario.findByIdAndUpdate(id, { $inc: incrementos }, { new: true }).exec();
  },

  eliminarPorId(id) {
    return Usuario.findByIdAndDelete(id).exec();
  },

  /** Usuarios sugeridos segun carrera, semestre e intereses (recomendaciones). */
  listarSugeridos({ excluirIds = [], carrera, intereses = [], limite = 10 }) {
    const condiciones = [{ _id: { $nin: excluirIds } }, { activo: true }, { bloqueado: false }];
    const preferencias = [];
    if (carrera) preferencias.push({ carrera });
    if (intereses.length > 0) preferencias.push({ intereses: { $in: intereses } });

    const filtro = preferencias.length > 0
      ? { $and: [...condiciones, { $or: preferencias }] }
      : { $and: condiciones };

    return Usuario.find(filtro).sort({ cantidadAmigos: -1 }).limit(limite).lean().exec();
  },

  /** Usuarios registrados por dia en un rango (estadisticas del panel). */
  contarPorDia(desde) {
    return Usuario.aggregate([
      { $match: { fechaCreacion: { $gte: desde } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaCreacion' } },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();
  },
};

module.exports = { repositorioUsuario };
