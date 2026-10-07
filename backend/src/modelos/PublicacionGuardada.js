const mongoose = require('mongoose');

const { Schema } = mongoose;

const publicacionGuardadaSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    publicacion: { type: Schema.Types.ObjectId, ref: 'Publicacion', required: true, index: true },
    // Categoria personal del usuario para organizar sus guardados.
    etiquetaPersonal: { type: String, trim: true, maxlength: 60, default: '' },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'publicaciones_guardadas',
  }
);

publicacionGuardadaSchema.index({ usuario: 1, publicacion: 1 }, { unique: true });
publicacionGuardadaSchema.index({ usuario: 1, fechaCreacion: -1 });

module.exports = mongoose.model('PublicacionGuardada', publicacionGuardadaSchema);
