const mongoose = require('mongoose');
const Reaccion = require('../modelos/Reaccion');

const repositorioReaccion = {
  /** Crea la reaccion o cambia el tipo si el usuario ya reacciono al objetivo. */
  crearOActualizar({ usuario, objetivo, objetivoModelo, tipo }) {
    return Reaccion.findOneAndUpdate(
      { usuario, objetivo },
      { usuario, objetivo, objetivoModelo, tipo },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },

  buscar({ usuario, objetivo }) {
    return Reaccion.findOne({ usuario, objetivo }).lean().exec();
  },

  eliminar({ usuario, objetivo }) {
    return Reaccion.findOneAndDelete({ usuario, objetivo }).exec();
  },

  eliminarPorObjetivo(objetivo) {
    return Reaccion.deleteMany({ objetivo }).exec();
  },

  /** Reacciones de un usuario sobre una lista de publicaciones (una sola consulta). */
  listarDeUsuarioEnObjetivos(usuario, objetivos) {
    return Reaccion.find({ usuario, objetivo: { $in: objetivos } }).lean().exec();
  },

  contarPorTipo(objetivo) {
    return Reaccion.aggregate([
      { $match: { objetivo: new mongoose.Types.ObjectId(String(objetivo)) } },
      { $group: { _id: '$tipo', cantidad: { $sum: 1 } } },
    ]).exec();
  },

  contar(filtro = {}) {
    return Reaccion.countDocuments(filtro);
  },
};

module.exports = { repositorioReaccion };
