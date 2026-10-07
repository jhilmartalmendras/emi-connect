import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Eye, MapPin, Pencil, Trash2, Flag, Store, Send } from 'lucide-react';
import { Avatar } from '../componentes/comunes/Avatar';
import { Boton } from '../componentes/comunes/Boton';
import { Insignia } from '../componentes/comunes/Insignia';
import { EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { Modal, ModalConfirmacion } from '../componentes/comunes/Modal';
import { Campo, AreaTexto, Selector, Casilla } from '../componentes/comunes/EntradaTexto';
import { ModalReporte } from '../componentes/comunes/ModalReporte';
import { useToast } from '../contexto/ContextoToast';
import { servicioProductos } from '../servicios/servicioProductos';
import { servicioMensajes } from '../servicios/servicioMensajes';
import { CATEGORIAS_PRODUCTO, ESTADOS_PRODUCTO } from '../constantes/catalogos';
import { fechaCorta, tiempoRelativo } from '../utilidades/fechas';
import { formatearPrecio, nombreCompleto, plural, urlArchivo } from '../utilidades/textos';

/** Detalle del producto: galeria, vendedor, contacto y gestion. */
export default function DetalleProducto() {
  const { id } = useParams();
  const toast = useToast();
  const navegar = useNavigate();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [contactando, setContactando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [reportando, setReportando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await servicioProductos.obtener(id);
      setDatos(resultado);
      setImagenActiva(0);
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudo cargar el producto.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const producto = datos?.producto;

  /**
   * Contacta al vendedor: registra el interes, abre la conversacion
   * y envia un mensaje inicial para continuar por mensajeria.
   */
  const contactar = async () => {
    setContactando(true);
    try {
      const interes = await servicioProductos.contactarVendedor(id);
      const mensaje =
        `Hola ${nombreCompleto(interes.vendedor)}, me interesa tu producto "${producto.titulo}". ¿Sigue disponible?`;

      const conversacion = await servicioMensajes.abrirConversacion(producto.vendedor._id);
      await servicioMensajes.enviar({ conversacionId: conversacion.conversacion._id, contenido: mensaje });

      toast.exito('Se abrio una conversacion con el vendedor.');
      navegar(`/mensajes/${conversacion.conversacion._id}`);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo contactar al vendedor.');
    } finally {
      setContactando(false);
    }
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      await servicioProductos.eliminar(id);
      toast.exito('Producto eliminado del marketplace.');
      navegar('/marketplace');
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo eliminar el producto.');
      setEliminando(false);
    }
  };

  if (cargando) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <Esqueleto className="h-80 w-full rounded-xl" />
        <div className="space-y-3">
          <Esqueleto className="h-6 w-3/4" />
          <Esqueleto className="h-8 w-1/3" />
          <Esqueleto className="h-4 w-full" />
          <Esqueleto className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return <EstadoError mensaje="No pudimos cargar el producto" detalle={error || ''} alReintentar={cargar} />;
  }

  const estado = ESTADOS_PRODUCTO.find((item) => item.valor === producto.estado) || ESTADOS_PRODUCTO[0];
  const categoria = CATEGORIAS_PRODUCTO.find((item) => item.valor === producto.categoria);
  const imagenes = producto.imagenes || [];
  const vendedor = producto.vendedor || {};

  return (
    <div className="space-y-4">
      <section className="tarjeta overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Galeria */}
          <div className="bg-emi-50 dark:bg-emi-800">
            {imagenes.length > 0 ? (
              <div>
                <img
                  src={urlArchivo(imagenes[imagenActiva])}
                  alt={producto.titulo}
                  className="h-72 w-full object-cover md:h-80"
                />
                {imagenes.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {imagenes.map((imagen, indice) => (
                      <button
                        key={imagen}
                        type="button"
                        onClick={() => setImagenActiva(indice)}
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          indice === imagenActiva ? 'border-emi-600' : 'border-transparent opacity-70'
                        }`}
                        aria-label={`Ver imagen ${indice + 1}`}
                      >
                        <img src={urlArchivo(imagen)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-6xl md:h-80" aria-hidden="true">
                🛍️
              </div>
            )}
          </div>

          {/* Informacion */}
          <div className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Insignia className={estado.color}>{estado.etiqueta}</Insignia>
              {categoria && <Insignia className="bg-emi-100 text-emi-700 dark:bg-emi-800 dark:text-emi-100">{categoria.etiqueta}</Insignia>}
              {producto.esNegociable && (
                <Insignia className="bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100">
                  Negociable
                </Insignia>
              )}
            </div>

            <h1 className="text-xl font-bold text-emi-900 dark:text-emi-50">{producto.titulo}</h1>

            <p className="text-2xl font-bold text-emi-700 dark:text-dorado-400">
              {formatearPrecio(producto.precio, producto.moneda)}
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-emi-400">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                {plural(producto.vistas || 0, 'vista')}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {producto.ubicacion || 'EMI'}
              </span>
              <span>Publicado {tiempoRelativo(producto.fechaCreacion)}</span>
            </div>

            {producto.descripcion && (
              <p className="whitespace-pre-wrap border-t border-emi-100 pt-3 text-sm leading-relaxed text-emi-700 dark:border-emi-800 dark:text-emi-100">
                {producto.descripcion}
              </p>
            )}

            {/* Vendedor */}
            <div className="mt-auto flex items-center gap-3 border-t border-emi-100 pt-3 dark:border-emi-800">
              <Avatar usuario={vendedor} tamanos="normal" />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/perfil/${vendedor._id}`}
                  className="block truncate text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50"
                >
                  {nombreCompleto(vendedor)}
                </Link>
                <p className="truncate text-xs text-emi-500">{vendedor.carrera || 'Comunidad EMI'}</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              {producto.esMio ? (
                <>
                  <Boton variante="contorno" icono={Pencil} onClick={() => setEditando(true)}>
                    Editar anuncio
                  </Boton>
                  <Boton variante="peligro" icono={Trash2} onClick={() => setEliminando(true)}>
                    Eliminar
                  </Boton>
                </>
              ) : (
                <>
                  <Boton variante="primario" icono={MessageSquare} onClick={contactar} cargando={contactando}>
                    Contactar vendedor
                  </Boton>
                  <Boton variante="sutil" tamano="pequeno" icono={Flag} onClick={() => setReportando(true)}>
                    Reportar
                  </Boton>
                </>
              )}
            </div>

            <p className="text-[11px] text-emi-400">
              Publicado el {fechaCorta(producto.fechaCreacion)} · {plural(producto.interesados?.length || 0, 'interesado')}
            </p>
          </div>
        </div>
      </section>

      {/* Edicion para el vendedor */}
      {producto.esMio && (
        <ModalEdicionProducto
          abierto={editando}
          alCerrar={() => setEditando(false)}
          producto={producto}
          alGuardar={() => {
            setEditando(false);
            cargar();
          }}
        />
      )}

      <ModalConfirmacion
        abierto={eliminando}
        alCerrar={() => setEliminando(false)}
        alConfirmar={eliminar}
        titulo="Eliminar producto"
        mensaje="El anuncio se eliminara del marketplace de forma permanente."
        textoConfirmar="Eliminar"
        cargando={eliminando}
      />

      <ModalReporte
        abierto={reportando}
        alCerrar={() => setReportando(false)}
        tipo="producto"
        objetivoId={producto._id}
        descripcionObjetivo={producto.titulo}
      />
    </div>
  );
}

/** Formulario de edicion del anuncio para su vendedor. */
function ModalEdicionProducto({ abierto, alCerrar, producto, alGuardar }) {
  const toast = useToast();
  const [formulario, setFormulario] = useState({
    titulo: producto.titulo || '',
    descripcion: producto.descripcion || '',
    precio: producto.precio ?? '',
    moneda: producto.moneda || 'BOB',
    esNegociable: Boolean(producto.esNegociable),
    categoria: producto.categoria || 'otros',
    ubicacion: producto.ubicacion || '',
    estado: producto.estado || 'disponible',
  });
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave) => (valor) => setFormulario((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async () => {
    if (formulario.titulo.trim().length < 4) {
      toast.error('El titulo debe tener al menos 4 caracteres.');
      return;
    }
    if (formulario.precio === '' || Number(formulario.precio) < 0) {
      toast.error('Indica un precio valido.');
      return;
    }

    setGuardando(true);
    try {
      await servicioProductos.actualizar(producto._id, {
        titulo: formulario.titulo.trim(),
        descripcion: formulario.descripcion.trim(),
        precio: Number(formulario.precio),
        moneda: formulario.moneda,
        esNegociable: formulario.esNegociable,
        categoria: formulario.categoria,
        ubicacion: formulario.ubicacion.trim(),
        estado: formulario.estado,
      });
      toast.exito('Producto actualizado correctamente.');
      alGuardar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo actualizar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Editar producto"
      tamanos="normal"
      bloquearCierre={guardando}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={guardando}>
            Cancelar
          </Boton>
          <Boton variante="primario" icono={Send} onClick={guardar} cargando={guardando}>
            Guardar cambios
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo etiqueta="Titulo" valor={formulario.titulo} alCambiar={cambiar('titulo')} requerido maxLength={140} />
        <AreaTexto
          etiqueta="Descripcion"
          valor={formulario.descripcion}
          alCambiar={cambiar('descripcion')}
          filas={3}
          maxLength={2000}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Precio" tipo="number" valor={formulario.precio} alCambiar={cambiar('precio')} min={0} requerido />
          <Selector
            etiqueta="Moneda"
            valor={formulario.moneda}
            alCambiar={cambiar('moneda')}
            opciones={[
              { valor: 'BOB', etiqueta: 'Bolivianos (Bs)' },
              { valor: 'USD', etiqueta: 'Dolares (USD)' },
            ]}
          />
          <Selector
            etiqueta="Estado"
            valor={formulario.estado}
            alCambiar={cambiar('estado')}
            opciones={ESTADOS_PRODUCTO}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Selector
            etiqueta="Categoria"
            valor={formulario.categoria}
            alCambiar={cambiar('categoria')}
            opciones={CATEGORIAS_PRODUCTO}
          />
          <Campo etiqueta="Ubicacion" valor={formulario.ubicacion} alCambiar={cambiar('ubicacion')} />
        </div>
        <Casilla etiqueta="Precio negociable" valor={formulario.esNegociable} alCambiar={cambiar('esNegociable')} />
      </div>
    </Modal>
  );
}
