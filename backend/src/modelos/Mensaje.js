const mongoose = require('mongoose');

const { Schema } = mongoose;

const mensajeSchema = new Schema(
  {
    conversacion: { type: Schema.Types.ObjectId, ref: 'Conversacion', required: true, index: true },
    emisor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    contenido: { type: String, trim: true, maxlength: 2000, default: '' },
    imagen: { type: String, default: '' },
    leido: { type: Boolean, default: false, index: true },
    fechaLectura: { type: Date, default: null },
    eliminado: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'mensajes',
  }
);

mensajeSchema.index({ conversacion: 1, fechaCreacion: -1 });

module.exports = mongoose.model('Mensaje', mensajeSchema);
