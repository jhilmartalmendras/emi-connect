import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, UserPlus, Inbox, Send, Search } from 'lucide-react';
import { TarjetaUsuario } from '../componentes/contenido/TarjetaUsuario';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { Campo } from '../componentes/comunes/EntradaTexto';
import { useToast } from '../contexto/ContextoToast';
import { useDebounce } from '../hooks/useDebounce';
import { servicioAmistades } from '../servicios/servicioAmistades';
import { servicioUsuarios } from '../servicios/servicioUsuarios';
import { servicioMensajes } from '../servicios/servicioMensajes';
import { nombreCompleto } from '../utilidades/textos';

const PESTANAS = [
  { valor: 'amigos', etiqueta: 'Mis contactos', icono: Users },
  { valor: 'solicitudes', etiqueta: 'Solicitudes', icono: Inbox },
  { valor: 'enviadas', etiqueta: 'Enviadas', icono: Send },
  { valor: 'personas', etiqueta: 'Encontrar personas', icono: UserPlus },
];

/** Pagina de amistades: contactos, solicitudes y directorio de la comunidad. */
export default function Amigos() {
  const toast = useToast();
  const [parametros, setParametros] = useSearchParams();
  const pestanaInicial = parametros.get('pestana') || 'amigos';

  const [pestana, setPestana] = useState(pestanaInicial);
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [texto, setTexto] = useState('');
  const [acciones, setAcciones] = useState({});
  // Relaciones del usuario para saber que accion mostrar en el directorio.
  const [relaciones, setRelaciones] = useState({ amigos: new Set(), recibidas: new Set(), enviadas: new Set() });

  const textoRetrasado = useDebounce(texto, 350);

  const cambiarPestana = (valor) => {
    setPestana(valor);
    setParametros({ pestana: valor }, { replace: true });
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      if (pestana === 'amigos') {
        const datos = await servicioAmistades.listarAmigos(1, 60);
        setElementos(datos.amigos || []);
      } else if (pestana === 'solicitudes') {
        const datos = await servicioAmistades.listarRecibidas(1, 40);
        setElementos(datos.solicitudes || []);
      } else if (pestana === 'enviadas') {
        const datos = await servicioAmistades.listarEnviadas(1, 40);
        setElementos(datos.solicitudes || []);
      } else {
        const datos = await servicioUsuarios.listarUsuarios({ buscar: textoRetrasado, limite: 30 });
        setElementos(datos.usuarios || []);

        // Se cargan las relaciones existentes para no reenviar solicitudes.
        const [amigos, recibidas, enviadas] = await Promise.all([
          servicioAmistades.listarAmigos(1, 100).catch(() => ({ amigos: [] })),
          servicioAmistades.listarRecibidas(1, 100).catch(() => ({ solicitudes: [] })),
          servicioAmistades.listarEnviadas(1, 100).catch(() => ({ solicitudes: [] })),
        ]);
        setRelaciones({
          amigos: new Set((amigos.amigos || []).map((item) => String(item._id))),
          recibidas: new Set(
            (recibidas.solicitudes || []).map((item) => String(item.solicitante?._id || item.solicitante))
          ),
          enviadas: new Set(
            (enviadas.solicitudes || []).map((item) => String(item.receptor?._id || item.receptor))
          ),
        });
      }
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudo cargar la informacion.');
      setElementos([]);
    } finally {
      setCargando(false);
    }
  }, [pestana, textoRetrasado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Ejecuta una accion de solicitud mostrando su estado de carga. */
  const ejecutar = async (clave, funcion, mensajeExito) => {
    setAcciones((actuales) => ({ ...actuales, [clave]: true }));
    try {
      await funcion();
      toast.exito(mensajeExito);
      await cargar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo completar la accion.');
    } finally {
      setAcciones((actuales) => ({ ...actuales, [clave]: false }));
    }
  };

  /** Abre una conversacion con un contacto. */
  const escribirMensaje = async (usuario) => {
    try {
      const datos = await servicioMensajes.abrirConversacion(usuario._id);
      window.location.assign(`/mensajes/${datos.conversacion._id}`);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo abrir la conversacion.');
    }
  };

  /** Construye la accion de cada tarjeta segun la pestana activa. */
  const accionPara = (item) => {
    if (pestana === 'amigos') {
      return {
        etiqueta: 'Mensaje',
        variante: 'secundario',
        alEjecutar: () => escribirMensaje(item),
      };
    }

    if (pestana === 'solicitudes') {
      const solicitante = item.solicitante || item;
      return {
        etiqueta: 'Aceptar',
        variante: 'primario',
        cargando: acciones[`aceptar-${item._id}`],
        alEjecutar: () =>
          ejecutar(`aceptar-${item._id}`, () => servicioAmistades.aceptarSolicitud(item._id), `Ahora ${nombreCompleto(solicitante)} es tu contacto.`),
      };
    }

    if (pestana === 'enviadas') {
      return {
        etiqueta: 'Cancelar',
        variante: 'contorno',
        cargando: acciones[`cancelar-${item._id}`],
        alEjecutar: () =>
          ejecutar(`cancelar-${item._id}`, () => servicioAmistades.cancelarSolicitud(item._id), 'Solicitud cancelada.'),
      };
    }

    // Directorio de personas: la accion depende de la relacion existente.
    const id = String(item._id);
    if (relaciones.amigos.has(id)) {
      return {
        etiqueta: 'Contactos',
        variante: 'contorno',
        deshabilitado: true,
        alEjecutar: () => {},
      };
    }
    if (relaciones.recibidas.has(id)) {
      return {
        etiqueta: 'Aceptar',
        variante: 'primario',
        cargando: acciones[`aceptar-dir-${id}`],
        alEjecutar: () =>
          ejecutar(`aceptar-dir-${id}`, async () => {
            const datos = await servicioAmistades.listarRecibidas(1, 100);
            const relacion = (datos.solicitudes || []).find(
              (item2) => String(item2.solicitante?._id || item2.solicitante) === id
            );
            if (relacion) await servicioAmistades.aceptarSolicitud(relacion._id);
          }, 'Solicitud aceptada.'),
      };
    }
    if (relaciones.enviadas.has(id)) {
      return {
        etiqueta: 'Solicitud enviada',
        variante: 'contorno',
        cargando: acciones[`cancelar-dir-${id}`],
        alEjecutar: () =>
          ejecutar(`cancelar-dir-${id}`, async () => {
            const datos = await servicioAmistades.listarEnviadas(1, 100);
            const relacion = (datos.solicitudes || []).find(
              (item2) => String(item2.receptor?._id || item2.receptor) === id
            );
            if (relacion) await servicioAmistades.cancelarSolicitud(relacion._id);
          }, 'Solicitud cancelada.'),
      };
    }

    return {
      etiqueta: 'Agregar',
      variante: 'primario',
      cargando: acciones[`agregar-${id}`],
      alEjecutar: () =>
        ejecutar(`agregar-${id}`, () => servicioAmistades.enviarSolicitud(item._id), 'Solicitud de amistad enviada.'),
    };
  };

  /** Rechaza una solicitud recibida (pestana de solicitudes). */
  const rechazar = async (solicitud) => {
    await ejecutar(
      `rechazar-${solicitud._id}`,
      () => servicioAmistades.rechazarSolicitud(solicitud._id),
      'Solicitud rechazada.'
    );
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo-seccion">Amigos y contactos</h1>
        <span className="texto-secundario">Conectate con la comunidad EMI</span>
      </header>

      {/* Pestanas */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-emi-100 bg-white p-1 dark:border-emi-800 dark:bg-emi-900">
        {PESTANAS.map((item) => {
          const Icono = item.icono;
          return (
            <button
              key={item.valor}
              type="button"
              onClick={() => cambiarPestana(item.valor)}
              aria-current={pestana === item.valor}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                pestana === item.valor
                  ? 'bg-emi-700 text-white'
                  : 'text-emi-500 hover:bg-emi-50 dark:text-emi-300 dark:hover:bg-emi-800'
              }`}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {item.etiqueta}
            </button>
          );
        })}
      </div>

      {/* Buscador del directorio */}
      {pestana === 'personas' && (
        <Campo
          etiqueta=""
          valor={texto}
          alCambiar={setTexto}
          marcador="Buscar por nombre, carrera o correo..."
          icono={Search}
        />
      )}

      {/* Contenido */}
      {cargando && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, indice) => (
            <div key={indice} className="tarjeta flex items-center gap-3 p-4">
              <Esqueleto className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Esqueleto className="h-4 w-48" />
                <Esqueleto className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar esta seccion" detalle={error} alReintentar={cargar} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio
          titulo={
            pestana === 'amigos'
              ? 'Todavia no tienes contactos'
              : pestana === 'solicitudes'
              ? 'No tienes solicitudes pendientes'
              : pestana === 'enviadas'
              ? 'No has enviado solicitudes'
              : 'No encontramos personas con esa busqueda'
          }
          descripcion={
            pestana === 'personas'
              ? 'Prueba con otro nombre, carrera o correo institucional.'
              : 'Visita la seccion "Encontrar personas" para conectar con tu comunidad.'
          }
          icono={pestana === 'solicitudes' ? Inbox : Users}
          accion={pestana !== 'personas' ? () => cambiarPestana('personas') : null}
          etiquetaAccion="Encontrar personas"
        />
      )}

      {!cargando && !error && elementos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {elementos.map((item) => {
            const persona =
              pestana === 'amigos'
                ? item
                : pestana === 'personas'
                ? item
                : item.solicitante || item.receptor || item;

            if (!persona || !persona._id) return null;

            const subtitulo =
              pestana === 'solicitudes' || pestana === 'enviadas'
                ? item.mensaje || `Solicitud ${item.estado === 'pendiente' ? 'pendiente' : item.estado}`
                : '';

            return (
              <TarjetaUsuario
                key={item._id || persona._id}
                usuario={persona}
                subtitulo={subtitulo}
                accion={accionPara(item)}
                accionSecundaria={
                  pestana === 'solicitudes'
                    ? {
                        etiqueta: 'Rechazar',
                        variante: 'contorno',
                        cargando: acciones[`rechazar-${item._id}`],
                        alEjecutar: () => rechazar(item),
                      }
                    : null
                }
                mostrarCantidadAmigos={pestana === 'personas'}
              />
            );
          })}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Link to="/buscar" className="text-sm enlace">
          Buscar personas con el buscador global
        </Link>
      </div>
    </div>
  );
}
