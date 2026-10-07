const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Codigos de verificacion de cuenta y de recuperacion de contrasena.
 * El codigo NUNCA se guarda en texto plano: se almacena un hash HMAC-SHA256
 * que permite buscarlo por indice sin exponerlo.
 * El indice TTL elimina los tokens expirados automaticamente.
 */
const tokenVerificacionSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    correo: { type: String, required: true, lowercase: true, trim: true },
    codigoHash: { type: String, required: true, index: true },
    tipo: {
      type: String,
      enum: ['verificacion', 'recuperacion_contrasena'],
      default: 'verificacion',
    },
    intentos: { type: Number, default: 0, min: 0 },
    maxIntentos: { type: Number, default: 5 },
    usado: { type: Boolean, default: false },
    expiraEn: { type: Date, required: true },
    fechaUso: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'tokens_verificacion',
  }
);

tokenVerificacionSchema.index({ usuario: 1, tipo: 1, usado: 1 });
tokenVerificacionSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenVerificacion', tokenVerificacionSchema);
