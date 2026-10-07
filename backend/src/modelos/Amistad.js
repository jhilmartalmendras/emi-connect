const mongoose = require('mongoose');
const { ESTADOS_AMISTAD } = require('../constantes/catalogos');

const { Schema } = mongoose;

/**
 * Relacion de amistad entre dos usuarios.
 * Se guarda una sola fila por par (solicitante -> receptor). Si el receptor
 * solicita despues al solicitante, el servicio invierte y acepta la existente.
 */
const amistadSchema = new Schema(
  {
    solicitante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    receptor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    estado: { type: String, enum: ESTADOS_AMISTAD, default: 'pendiente', index: true },
    mensaje: { type: String, trim: true, maxlength: 200, default: '' },
    fechaRespuesta: { type: Date, default: null },
    // Marca de lectura para mostrar el contador de solicitudes nuevas.
    leidaPorReceptor: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'amistades',
  }
);

amistadSchema.index({ solicitante: 1, receptor: 1 }, { unique: true });
amistadSchema.index({ receptor: 1, estado: 1 });
amistadSchema.index({ solicitante: 1, estado: 1 });

module.exports = mongoose.model('Amistad', amistadSchema);
