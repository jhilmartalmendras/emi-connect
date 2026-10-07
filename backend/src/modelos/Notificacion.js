const mongoose = require('mongoose');
const { TIPOS_NOTIFICACION } = require('../constantes/catalogos');

const { Schema } = mongoose;

const notificacionSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    tipo: { type: String, enum: TIPOS_NOTIFICACION, required: true },
    titulo: { type: String, required: true, trim: true, maxlength: 160 },
    mensaje: { type: String, trim: true, maxlength: 400, default: '' },
    // Ruta interna del frontend a la que debe navegar la notificacion.
    enlace: { type: String, default: '' },
    actor: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },

    referencias: {
      publicacion: { type: Schema.Types.ObjectId, ref: 'Publicacion', default: null },
      comentario: { type: Schema.Types.ObjectId, ref: 'Comentario', default: null },
      comunidad: { type: Schema.Types.ObjectId, ref: 'Comunidad', default: null },
      evento: { type: Schema.Types.ObjectId, ref: 'Evento', default: null },
      conversacion: { type: Schema.Types.ObjectId, ref: 'Conversacion', default: null },
      producto: { type: Schema.Types.ObjectId, ref: 'Producto', default: null },
    },

    leida: { type: Boolean, default: false, index: true },
    fechaLectura: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'notificaciones',
  }
);

notificacionSchema.index({ usuario: 1, leida: 1, fechaCreacion: -1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);
