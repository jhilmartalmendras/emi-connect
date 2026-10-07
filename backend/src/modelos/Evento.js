const mongoose = require('mongoose');

const { Schema } = mongoose;

const eventoSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 160, index: true },
    descripcion: { type: String, trim: true, maxlength: 2000, default: '' },
    fecha: { type: Date, required: true, index: true },
    horaFin: { type: Date, default: null },
    ubicacion: { type: String, trim: true, maxlength: 200, default: '' },
    imagen: { type: String, default: '' },
    organizador: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    comunidad: { type: Schema.Types.ObjectId, ref: 'Comunidad', default: null, index: true },
    categoria: { type: String, trim: true, default: 'general' },

    // cupos = 0 significa sin limite de participantes.
    cupos: { type: Number, default: 0, min: 0 },

    esInstitucional: { type: Boolean, default: false },
    cancelado: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },

    // Contadores por estado de asistencia (se mantienen con $inc).
    cantidadInteresados: { type: Number, default: 0, min: 0 },
    cantidadAsistentes: { type: Number, default: 0, min: 0 },
    cantidadNoAsistentes: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'eventos',
  }
);

eventoSchema.index({ nombre: 'text', descripcion: 'text' });
eventoSchema.index({ fecha: 1, activo: 1 });

module.exports = mongoose.model('Evento', eventoSchema);
