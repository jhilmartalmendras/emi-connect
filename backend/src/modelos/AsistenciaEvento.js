const mongoose = require('mongoose');
const { ESTADOS_ASISTENCIA } = require('../constantes/catalogos');

const { Schema } = mongoose;

const asistenciaEventoSchema = new Schema(
  {
    evento: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    estado: { type: String, enum: ESTADOS_ASISTENCIA, required: true, default: 'interesado' },
    fechaConfirmacion: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'asistencias_evento',
  }
);

asistenciaEventoSchema.index({ evento: 1, usuario: 1 }, { unique: true });

module.exports = mongoose.model('AsistenciaEvento', asistenciaEventoSchema);
