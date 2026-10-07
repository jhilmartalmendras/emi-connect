const mongoose = require('mongoose');

const { Schema } = mongoose;

const noLeidosSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    cantidad: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

/**
 * Conversacion privada. En esta primera version son siempre uno a uno,
 * el arreglo "participantes" queda preparado para grupos futuros.
 */
const conversacionSchema = new Schema(
  {
    participantes: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
      required: true,
      validate: {
        validator: (valor) => Array.isArray(valor) && valor.length >= 2 && valor.length <= 2,
        message: 'Una conversacion debe tener exactamente dos participantes',
      },
      index: true,
    },
    ultimoMensaje: { type: Schema.Types.ObjectId, ref: 'Mensaje', default: null },
    fechaUltimoMensaje: { type: Date, default: Date.now, index: true },
    noLeidos: { type: [noLeidosSchema], default: [] },
    activa: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'conversaciones',
  }
);

// Evita conversaciones duplicadas entre el mismo par de usuarios.
conversacionSchema.index({ participantes: 1, fechaUltimoMensaje: -1 });

module.exports = mongoose.model('Conversacion', conversacionSchema);
