const mongoose = require('mongoose');
const { CATEGORIAS_PUBLICACION, TIPOS_REACCION } = require('../constantes/catalogos');

const { Schema } = mongoose;

// Resumen numerico de reacciones para evitar consultas adicionales en el feed.
const resumenReaccionesSchema = new Schema(
  TIPOS_REACCION.reduce((acumulador, tipo) => {
    acumulador[tipo] = { type: Number, default: 0, min: 0 };
    return acumulador;
  }, {}),
  { _id: false }
);

const publicacionSchema = new Schema(
  {
    autor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    contenido: { type: String, trim: true, maxlength: 5000, default: '' },
    imagenes: { type: [String], default: [] },
    enlace: {
      url: { type: String, default: '' },
      titulo: { type: String, default: '' },
    },
    categoria: { type: String, enum: CATEGORIAS_PUBLICACION, default: 'general', index: true },

    // Publicacion oficial: solo roles autorizados pueden marcarla.
    esInstitucional: { type: Boolean, default: false, index: true },

    // Referencia a la publicacion original cuando la publicacion es compartida.
    publicacionOriginal: { type: Schema.Types.ObjectId, ref: 'Publicacion', default: null, index: true },

    // Contextos opcionales donde se publico el contenido.
    comunidad: { type: Schema.Types.ObjectId, ref: 'Comunidad', default: null, index: true },
    evento: { type: Schema.Types.ObjectId, ref: 'Evento', default: null },
    producto: { type: Schema.Types.ObjectId, ref: 'Producto', default: null },

    etiquetas: { type: [String], default: [] },

    reaccionesResumen: { type: resumenReaccionesSchema, default: () => ({}) },
    cantidadComentarios: { type: Number, default: 0, min: 0 },
    cantidadCompartidos: { type: Number, default: 0, min: 0 },
    cantidadGuardados: { type: Number, default: 0, min: 0 },

    editado: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    eliminado: { type: Boolean, default: false, index: true },
    eliminadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
    motivoEliminacion: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'publicaciones',
  }
);

// Indices para el feed, los perfiles y las comunidades.
publicacionSchema.index({ fechaCreacion: -1, eliminado: 1 });
publicacionSchema.index({ autor: 1, fechaCreacion: -1 });
publicacionSchema.index({ comunidad: 1, fechaCreacion: -1 });
publicacionSchema.index({ categoria: 1, fechaCreacion: -1 });
publicacionSchema.index({ contenido: 'text', etiquetas: 'text' });

module.exports = mongoose.model('Publicacion', publicacionSchema);
