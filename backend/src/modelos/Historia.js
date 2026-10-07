const mongoose = require('mongoose');

const { Schema } = mongoose;

const historiaSchema = new Schema(
  {
    autor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    imagen: { type: String, default: '' },
    texto: { type: String, trim: true, maxlength: 300, default: '' },
    colorFondo: { type: String, default: '#0b2039' },

    // La historia desaparece automaticamente 24 horas despues de su creacion.
    expiraEn: { type: Date, required: true },

    // Usuarios que vieron la historia (se guarda como lista para contar visualizaciones).
    visualizaciones: { type: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }], default: [] },
    activa: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'historias',
  }
);

historiaSchema.index({ fechaCreacion: -1 });
// MongoDB elimina automaticamente los documentos cuando expiraEn se cumple.
historiaSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Historia', historiaSchema);
