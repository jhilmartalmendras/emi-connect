const mongoose = require('mongoose');

const { Schema } = mongoose;

const miembroComunidadSchema = new Schema(
  {
    comunidad: { type: Schema.Types.ObjectId, ref: 'Comunidad', required: true, index: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    rol: { type: String, enum: ['miembro', 'moderador', 'administrador'], default: 'miembro' },
    estado: { type: String, enum: ['activo', 'pendiente', 'invitado'], default: 'activo', index: true },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'miembros_comunidad',
  }
);

miembroComunidadSchema.index({ comunidad: 1, usuario: 1 }, { unique: true });
miembroComunidadSchema.index({ usuario: 1, estado: 1 });

module.exports = mongoose.model('MiembroComunidad', miembroComunidadSchema);
