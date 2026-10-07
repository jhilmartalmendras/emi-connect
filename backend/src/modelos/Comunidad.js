const mongoose = require('mongoose');

const { Schema } = mongoose;

const comunidadSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120, index: true },
    descripcion: { type: String, trim: true, maxlength: 800, default: '' },
    imagen: { type: String, default: '' },
    portada: { type: String, default: '' },
    categoria: { type: String, trim: true, default: 'general', index: true },
    creador: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    reglas: { type: [String], default: [] },

    // Comunidad privada: requiere aprobacion o invitacion para ingresar.
    esPrivada: { type: Boolean, default: false },
    activa: { type: Boolean, default: true },

    cantidadMiembros: { type: Number, default: 0, min: 0 },
    cantidadPublicaciones: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'comunidades',
  }
);

comunidadSchema.index({ nombre: 'text', descripcion: 'text' });
comunidadSchema.index({ fechaCreacion: -1 });
comunidadSchema.index({ cantidadMiembros: -1 });

module.exports = mongoose.model('Comunidad', comunidadSchema);
