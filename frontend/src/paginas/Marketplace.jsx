import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Plus, Search } from 'lucide-react';
import { TarjetaProducto } from '../componentes/contenido/TarjetaProducto';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { Modal } from '../componentes/comunes/Modal';
import { Campo, AreaTexto, Selector, Casilla } from '../componentes/comunes/EntradaTexto';
import { useToast } from '../contexto/ContextoToast';
import { useDebounce } from '../hooks/useDebounce';
import { servicioProductos } from '../servicios/servicioProductos';
import { CATEGORIAS_PRODUCTO, ESTADOS_PRODUCTO } from '../constantes/catalogos';

/** Marketplace universitario: compra y venta entre miembros de la EMI. */
export default function Marketplace() {
  const toast = useToast();
  const navegar = useNavigate();

  const [pestana, setPestana] = useState('explorar');
  const [categoria, setCategoria] = useState('');
  const [orden, setOrden] = useState('recientes');
  const [busqueda, setBusqueda] = useState('');
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [abiertoCrear, setAbiertoCrear] = useState(false);

  const busquedaRetrasada = useDebounce(busqueda, 350);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      if (pestana === 'mios') {
        const datos = await servicioProductos.listarMios(1, 24);
        setElementos(datos.productos || []);
      } else {
        const datos = await servicioProductos.listar({
          pagina: 1,
          limite: 24,
          categoria: categoria || undefined,
          orden,
          buscar: busquedaRetrasada.trim() || undefined,
        });
        setElementos(datos.productos || []);
      }
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudieron cargar los productos.');
      setElementos([]);
    } finally {
      setCargando(false);
    }
  }, [pestana, categoria, orden, busquedaRetrasada]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Marketplace</h1>
          <p className="texto-secundario">Compra y venta de libros, equipos y material entrecompaneros.</p>
        </div>
        <Boton variante="primario" icono={Plus} onClick={() => setAbiertoCrear(true)}>
          Publicar producto
        </Boton>
      </header>

      {/* Pestanas */}
      <div className="flex gap-1 rounded-xl border border-emi-100 bg-white p-1 dark:border-emi-800 dark:bg-emi-900">
        {[
          { valor: 'explorar', etiqueta: 'Explorar' },
          { valor: 'mios', etiqueta: 'Mis productos' },
        ].map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => setPestana(opcion.valor)}
            aria-current={pestana === opcion.valor}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              pestana === opcion.valor
                ? 'bg-emi-700 text-white'
                : 'text-emi-500 hover:bg-emi-50 dark:text-emi-300 dark:hover:bg-emi-800'
            }`}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>

      {/* Filtros */}
      {pestana === 'explorar' && (
        <div className="flex flex-wrap items-center gap-3">
          <Campo
            etiqueta=""
            valor={busqueda}
            alCambiar={setBusqueda}
            marcador="Buscar productos..."
            icono={Search}
            className="w-full sm:w-72"
          />
          <Selector
            valor={categoria}
            alCambiar={setCategoria}
            opciones={CATEGORIAS_PRODUCTO}
            marcador="Todas las categorias"
            className="w-52"
          />
          <Selector
            valor={orden}
            alCambiar={setOrden}
            opciones={[
              { valor: 'recientes', etiqueta: 'Mas recientes' },
              { valor: 'precio_asc', etiqueta: 'Menor precio' },
              { valor: 'precio_desc', etiqueta: 'Mayor precio' },
            ]}
            marcador="Ordenar"
            className="w-44"
          />
        </div>
      )}

      {/* Contenido */}
      {cargando && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, indice) => (
            <div key={indice} className="tarjeta overflow-hidden">
              <Esqueleto className="h-40 w-full rounded-none" />
              <div className="space-y-2 p-3.5">
                <Esqueleto className="h-4 w-3/4" />
                <Esqueleto className="h-5 w-1/2" />
                <Esqueleto className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar el marketplace" detalle={error} alReintentar={cargar} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio
          titulo={
            pestana === 'mios'
              ? 'No has publicado productos'
              : busquedaRetrasada
              ? 'Sin resultados para tu busqueda'
              : 'No hay productos publicados'
          }
          descripcion={
            pestana === 'mios'
              ? 'Publica un libro, equipo o material que ya no necesites.'
              : 'Vuelve pronto: la comunidad publica productos constantemente.'
          }
          icono={Store}
          accion={() => (pestana === 'mios' ? setAbiertoCrear(true) : null)}
          etiquetaAccion="Publicar producto"
        />
      )}

      {!cargando && !error && elementos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {elementos.map((producto) => (
            <TarjetaProducto
              key={producto._id}
              producto={producto}
              className={producto.activo === false ? 'opacity-60' : ''}
            />
          ))}
        </div>
      )}

      <ModalCrearProducto
        abierto={abiertoCrear}
        alCerrar={() => setAbiertoCrear(false)}
        alCrear={(producto) => {
          setAbiertoCrear(false);
          setPestana('mios');
          if (producto) navegar(`/marketplace/${producto._id}`);
        }}
      />
    </div>
  );
}

/** Formulario de publicacion de productos. */
function ModalCrearProducto({ abierto, alCerrar, alCrear }) {
  const toast = useToast();
  const [formulario, setFormulario] = useState({
    titulo: '',
    descripcion: '',
    precio: '',
    moneda: 'BOB',
    esNegociable: true,
    categoria: 'otros',
    ubicacion: '',
  });
  const [imagenes, setImagenes] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave) => (valor) => setFormulario((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async () => {
    if (formulario.titulo.trim().length < 4) {
      toast.error('El titulo debe tener al menos 4 caracteres.');
      return;
    }
    if (formulario.descripcion.trim().length < 10) {
      toast.error('Describe el producto en al menos 10 caracteres.');
      return;
    }
    if (formulario.precio === '' || Number(formulario.precio) < 0) {
      toast.error('Indica un precio valido.');
      return;
    }

    setGuardando(true);
    try {
      const producto = await servicioProductos.crear({
        titulo: formulario.titulo.trim(),
        descripcion: formulario.descripcion.trim(),
        precio: Number(formulario.precio),
        moneda: formulario.moneda,
        esNegociable: formulario.esNegociable,
        categoria: formulario.categoria,
        ubicacion: formulario.ubicacion.trim(),
        imagenes,
      });
      toast.exito('Producto publicado correctamente.');
      setFormulario({
        titulo: '',
        descripcion: '',
        precio: '',
        moneda: 'BOB',
        esNegociable: true,
        categoria: 'otros',
        ubicacion: '',
      });
      setImagenes([]);
      alCrear(producto.producto);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo publicar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Publicar producto"
      descripcion="Solo se permite vender entre miembros de la comunidad EMI."
      tamanos="normal"
      bloquearCierre={guardando}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={guardando}>
            Cancelar
          </Boton>
          <Boton variante="primario" onClick={guardar} cargando={guardando}>
            Publicar
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo
          etiqueta="Titulo"
          valor={formulario.titulo}
          alCambiar={cambiar('titulo')}
          marcador="Ej. Laptop HP i5 usado"
          requerido
          maxLength={140}
        />

        <AreaTexto
          etiqueta="Descripcion"
          valor={formulario.descripcion}
          alCambiar={cambiar('descripcion')}
          filas={3}
          maxLength={2000}
          marcador="Estado, especificaciones, motivo de venta..."
          requerido
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            etiqueta="Precio"
            tipo="number"
            valor={formulario.precio}
            alCambiar={cambiar('precio')}
            min={0}
            requerido
          />
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
            etiqueta="Categoria"
            valor={formulario.categoria}
            alCambiar={cambiar('categoria')}
            opciones={CATEGORIAS_PRODUCTO}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Ubicacion"
            valor={formulario.ubicacion}
            alCambiar={cambiar('ubicacion')}
            marcador="Ej. Campus central EMI"
          />
          <div className="flex items-end pb-1">
            <Casilla
              etiqueta="Precio negociable"
              valor={formulario.esNegociable}
              alCambiar={cambiar('esNegociable')}
            />
          </div>
        </div>

        <label className="flex cursor-pointer flex-col gap-1 text-sm font-medium text-emi-800 dark:text-emi-100">
          Imagenes (hasta 4)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(evento) => setImagenes(Array.from(evento.target.files || []).slice(0, 4))}
            className="block w-full text-xs text-emi-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emi-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emi-700 hover:file:bg-emi-200"
          />
        </label>

        <p className="text-xs text-emi-400">Estado del anuncio: {ESTADOS_PRODUCTO[0].etiqueta}</p>
      </div>
    </Modal>
  );
}
