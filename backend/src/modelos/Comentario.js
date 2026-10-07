const mongoose = require('mongoose');
const { TIPOS_REACCION } = require('../constantes/catalogos');

const { Schema } = mongoose;

const resumenReaccionesSchema = new Schema(
  TIPOS_REACCION.reduce((acumulador, tipo) => {
    acumulador[tipo] = { type: Number, default: 0, min: 0 };
    return acumulador;
  }, {}),
  { _id: false }
);

const comentarioSchema = new Schema(
  {
    publicacion: { type: Schema.Types.ObjectId, ref: 'Publicacion', required: true, index: true },
    autor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    contenido: { type: String, required: true, trim: true, maxlength: 1500 },

    // Comentario padre para respuestas anidadas (maximo 3 niveles, validado en el servicio).
    comentarioPadre: { type: Schema.Types.ObjectId, ref: 'Comentario', default: null, index: true },
    // Nivel de anidamiento: 1 = comentario raiz.
    nivel: { type: Number, default: 1, min: 1, max: 3 },
    // Usuario al que se responde dentro del hilo.
    respondeA: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },

    reaccionesResumen: { type: resumenReaccionesSchema, default: () => ({}) },
    cantidadRespuestas: { type: Number, default: 0, min: 0 },

    editado: { type: Boolean, default: false },
    eliminado: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'comentarios',
  }
);

comentarioSchema.index({ publicacion: 1, fechaCreacion: -1 });
comentarioSchema.index({ comentarioPadre: 1, fechaCreacion: 1 });

module.exports = mongoose.model('Comentario', comentarioSchema);
