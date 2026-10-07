const mongoose = require('mongoose');
const { CATEGORIAS_PRODUCTO, ESTADOS_PRODUCTO } = require('../constantes/catalogos');

const { Schema } = mongoose;

const productoSchema = new Schema(
  {
    vendedor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    titulo: { type: String, required: true, trim: true, maxlength: 140, index: true },
    descripcion: { type: String, trim: true, maxlength: 2000, default: '' },
    precio: { type: Number, required: true, min: 0 },
    moneda: { type: String, default: 'BOB', enum: ['BOB', 'USD'] },
    esNegociable: { type: Boolean, default: true },
    categoria: { type: String, enum: CATEGORIAS_PRODUCTO, default: 'otros', index: true },
    imagenes: { type: [String], default: [] },
    ubicacion: { type: String, trim: true, maxlength: 120, default: '' },
    estado: { type: String, enum: ESTADOS_PRODUCTO, default: 'disponible', index: true },

    // Interesados que contactaron por el producto (referencia informativa).
    interesados: { type: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }], default: [] },
    vistas: { type: Number, default: 0, min: 0 },

    activo: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'productos',
  }
);

productoSchema.index({ titulo: 'text', descripcion: 'text' });
productoSchema.index({ categoria: 1, estado: 1, fechaCreacion: -1 });
productoSchema.index({ fechaCreacion: -1 });

module.exports = mongoose.model('Producto', productoSchema);
