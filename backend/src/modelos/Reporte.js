const mongoose = require('mongoose');
const { ESTADOS_REPORTE, TIPOS_REPORTE, MOTIVOS_REPORTE } = require('../constantes/catalogos');

const { Schema } = mongoose;

const reporteSchema = new Schema(
  {
    reportante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },

    // Contenido reportado (referencia polimorfica).
    tipo: { type: String, enum: TIPOS_REPORTE, required: true, index: true },
    objetivo: { type: Schema.Types.ObjectId, required: true, refPath: 'objetivoModelo' },
    objetivoModelo: {
      type: String,
      required: true,
      enum: ['Publicacion', 'Comentario', 'Usuario', 'Producto', 'Comunidad'],
    },

    motivo: { type: String, enum: MOTIVOS_REPORTE, required: true },
    descripcion: { type: String, trim: true, maxlength: 800, default: '' },
    estado: { type: String, enum: ESTADOS_REPORTE, default: 'pendiente', index: true },

    revisadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
    notaRevision: { type: String, trim: true, maxlength: 500, default: '' },
    fechaRevision: { type: Date, default: null },
    accionTomada: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'reportes',
  }
);

// Una persona no puede reportar dos veces el mismo contenido.
reporteSchema.index({ reportante: 1, objetivo: 1, tipo: 1 }, { unique: true });
reporteSchema.index({ estado: 1, fechaCreacion: -1 });

module.exports = mongoose.model('Reporte', reporteSchema);
