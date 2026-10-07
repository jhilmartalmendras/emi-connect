import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { TarjetaEvento } from '../componentes/contenido/TarjetaEvento';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { Modal } from '../componentes/comunes/Modal';
import { Campo, AreaTexto, Selector, Casilla } from '../componentes/comunes/EntradaTexto';
import { useToast } from '../contexto/ContextoToast';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { servicioEventos } from '../servicios/servicioEventos';
import { CATEGORIAS_PUBLICACION } from '../constantes/catalogos';
import { paraInputFecha } from '../utilidades/fechas';

const ROLES_INSTITUCIONAL = ['docente', 'moderador', 'administrador'];

/** Pagina de eventos: listado, confirmacion de asistencia y creacion. */
export default function Eventos() {
  const toast = useToast();
  const { usuario } = useAutenticacion();

  const [filtro, setFiltro] = useState('proximos');
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [abiertoCrear, setAbiertoCrear] = useState(false);
  const [asistencias, setAsistencias] = useState({});

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const parametros = { pagina: 1, limite: 24 };
      if (filtro === 'proximos') parametros.desde = new Date().toISOString();
      if (filtro === 'mis') parametros.misEventos = 'true';

      const datos = await servicioEventos.listar(parametros);
      setElementos(datos.eventos || []);
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudieron cargar los eventos.');
      setElementos([]);
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Confirma o cambia la asistencia a un evento. */
  const confirmar = async (evento, estado) => {
    setAsistencias((actuales) => ({ ...actuales, [evento._id]: true }));
    try {
      const resultado = await servicioEventos.confirmarAsistencia(evento._id, estado);
      toast.exito(resultado?.mensaje || 'Asistencia registrada.');
      cargar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo registrar la asistencia.');
    } finally {
      setAsistencias((actuales) => ({ ...actuales, [evento._id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Eventos</h1>
          <p className="texto-secundario">Conferencias, talleres, deportes y actividades de la comunidad EMI.</p>
        </div>
        <Boton variante="primario" icono={Plus} onClick={() => setAbiertoCrear(true)}>
          Crear evento
        </Boton>
      </header>

      {/* Filtros */}
      <div className="flex gap-1 rounded-xl border border-emi-100 bg-white p-1 dark:border-emi-800 dark:bg-emi-900">
        {[
          { valor: 'proximos', etiqueta: 'Proximos' },
          { valor: 'todos', etiqueta: 'Todos' },
          { valor: 'mis', etiqueta: 'Mis eventos' },
        ].map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => setFiltro(opcion.valor)}
            aria-current={filtro === opcion.valor}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              filtro === opcion.valor
                ? 'bg-emi-700 text-white'
                : 'text-emi-500 hover:bg-emi-50 dark:text-emi-300 dark:hover:bg-emi-800'
            }`}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {cargando && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, indice) => (
            <div key={indice} className="tarjeta flex gap-3 p-4">
              <Esqueleto className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Esqueleto className="h-4 w-3/4" />
                <Esqueleto className="h-3 w-1/2" />
                <Esqueleto className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar los eventos" detalle={error} alReintentar={cargar} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio
          titulo={filtro === 'mis' ? 'No tienes eventos todavia' : 'No hay eventos programados'}
          descripcion="Crea un evento o vuelve mas tarde: la comunidad publica actividades constantemente."
          icono={CalendarDays}
          accion={() => setAbiertoCrear(true)}
          etiquetaAccion="Crear evento"
        />
      )}

      {!cargando && !error && elementos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {elementos.map((evento) => (
            <TarjetaEvento
              key={evento._id}
              evento={evento}
              alAsistir={(estado) => confirmar(evento, estado)}
              asistiendo={asistencias[evento._id]}
            />
          ))}
        </div>
      )}

      <ModalCrearEvento
        abierto={abiertoCrear}
        alCerrar={() => setAbiertoCrear(false)}
        puedeSerInstitucional={ROLES_INSTITUCIONAL.includes(usuario?.rol)}
        alCrear={() => {
          setAbiertoCrear(false);
          setFiltro('todos');
          cargar();
        }}
      />
    </div>
  );
}

/** Formulario de creacion de eventos. */
function ModalCrearEvento({ abierto, alCerrar, alCrear, puedeSerInstitucional }) {
  const toast = useToast();
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    ubicacion: '',
    categoria: 'general',
    cupos: '',
    esInstitucional: false,
  });
  const [imagen, setImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave) => (valor) => setFormulario((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async () => {
    if (formulario.nombre.trim().length < 4) {
      toast.error('El nombre del evento debe tener al menos 4 caracteres.');
      return;
    }
    if (!formulario.fecha) {
      toast.error('Selecciona la fecha y hora del evento.');
      return;
    }
    if (new Date(formulario.fecha).getTime() < Date.now()) {
      toast.error('La fecha del evento no puede estar en el pasado.');
      return;
    }

    setGuardando(true);
    try {
      await servicioEventos.crear({
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
        fecha: new Date(formulario.fecha).toISOString(),
        ubicacion: formulario.ubicacion.trim(),
        categoria: formulario.categoria,
        cupos: formulario.cupos ? Number(formulario.cupos) : 0,
        esInstitucional: formulario.esInstitucional,
        imagen,
      });
      toast.exito('Evento creado correctamente.');
      setFormulario({ nombre: '', descripcion: '', fecha: '', ubicacion: '', categoria: 'general', cupos: '', esInstitucional: false });
      setImagen(null);
      alCrear();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo crear el evento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Crear evento"
      descripcion="Organiza una actividad para la comunidad EMI."
      tamanos="normal"
      bloquearCierre={guardando}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={guardando}>
            Cancelar
          </Boton>
          <Boton variante="primario" icono={CalendarDays} onClick={guardar} cargando={guardando}>
            Crear evento
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo
          etiqueta="Nombre del evento"
          valor={formulario.nombre}
          alCambiar={cambiar('nombre')}
          marcador="Ej. Taller de Inteligencia Artificial"
          requerido
          maxLength={160}
        />

        <AreaTexto
          etiqueta="Descripcion"
          valor={formulario.descripcion}
          alCambiar={cambiar('descripcion')}
          filas={3}
          maxLength={2000}
          marcador="Objetivos, dirigido a quien, que llevar..."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Fecha y hora"
            tipo="datetime-local"
            valor={formulario.fecha}
            alCambiar={cambiar('fecha')}
            requerido
          />
          <Campo
            etiqueta="Ubicacion"
            valor={formulario.ubicacion}
            alCambiar={cambiar('ubicacion')}
            marcador="Ej. Auditorio Central EMI"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Selector
            etiqueta="Categoria"
            valor={formulario.categoria}
            alCambiar={cambiar('categoria')}
            opciones={CATEGORIAS_PUBLICACION.map((item) => ({ valor: item.valor, etiqueta: item.etiqueta }))}
          />
          <Campo
            etiqueta="Cupos (0 = ilimitado)"
            tipo="number"
            valor={formulario.cupos}
            alCambiar={cambiar('cupos')}
            min={0}
            max={100000}
          />
        </div>

        {puedeSerInstitucional && (
          <Casilla
            etiqueta="Evento institucional oficial"
            valor={formulario.esInstitucional}
            alCambiar={cambiar('esInstitucional')}
            ayuda="Se mostrara con la insignia oficial de la EMI."
          />
        )}

        <label className="flex cursor-pointer flex-col gap-1 text-sm font-medium text-emi-800 dark:text-emi-100">
          Imagen del evento (opcional)
          <input
            type="file"
            accept="image/*"
            onChange={(evento) => setImagen(evento.target.files?.[0] || null)}
            className="block w-full text-xs text-emi-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emi-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emi-700 hover:file:bg-emi-200"
          />
        </label>
      </div>
    </Modal>
  );
}
