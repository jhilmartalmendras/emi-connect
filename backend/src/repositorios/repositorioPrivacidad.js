const ConfiguracionPrivacidad = require('../modelos/ConfiguracionPrivacidad');

const repositorioPrivacidad = {
  /** Obtiene la configuracion del usuario; si no existe, la crea con valores por defecto. */
  obtenerOCrear(usuarioId) {
    return ConfiguracionPrivacidad.findOneAndUpdate(
      { usuario: usuarioId },
      { $setOnInsert: { usuario: usuarioId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean().exec();
  },

  actualizar(usuarioId, cambios) {
    return ConfiguracionPrivacidad.findOneAndUpdate(
      { usuario: usuarioId },
      { $set: cambios },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean().exec();
  },

  eliminarPorUsuario(usuarioId) {
    return ConfiguracionPrivacidad.findOneAndDelete({ usuario: usuarioId }).exec();
  },
};

module.exports = { repositorioPrivacidad };
