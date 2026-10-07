const mongoose = require('mongoose');

const { Schema } = mongoose;

const bloqueoSchema = new Schema(
  {
    quienBloquea: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    bloqueado: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    motivo: { type: String, trim: true, maxlength: 200, default: '' },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'bloqueos',
  }
);

bloqueoSchema.index({ quienBloquea: 1, bloqueado: 1 }, { unique: true });

module.exports = mongoose.model('Bloqueo', bloqueoSchema);
