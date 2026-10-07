import { useCallback, useEffect, useState } from 'react';
import { ListaNotificaciones } from '../componentes/notificaciones/ListaNotificaciones';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoError } from '../componentes/comunes/EstadoVacio';
import { useToast } from '../contexto/ContextoToast';
import { useContadores } from '../contexto/ContextoContadores';
import { servicioNotificaciones } from '../servicios/servicioNotificaciones';

/** Historial completo de notificaciones con marcado y eliminacion. */
export default function Notificaciones() {
  const toast = useToast();
  const { actualizarContador, recargar } = useContadores();

  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(
    async (numeroPagina = 1) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await servicioNotificaciones.listar({
          pagina: numeroPagina,
          limite: 20,
          soloNoLeidas,
        });
        setElementos((actuales) =>
          numeroPagina === 1 ? datos.notificaciones || [] : [...actuales, ...(datos.notificaciones || [])]
        );
        setPagina(numeroPagina);
        setHayMas(Boolean(datos.paginacion?.hayPaginaSiguiente));
        actualizarContador('notificaciones', datos.noLeidas || 0);
      } catch (excepcion) {
        setError(excepcion.mensaje || 'No se pudieron cargar las notificaciones.');
      } finally {
        setCargando(false);
      }
    },
    [soloNoLeidas, actualizarContador]
  );

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  const marcarLeida = async (notificacion) => {
    setProcesando(true);
    try {
      await servicioNotificaciones.marcarLeida(notificacion._id);
      setElementos((actuales) =>
        actuales.map((item) => (item._id === notificacion._id ? { ...item, leida: true } : item))
      );
      recargar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo marcar la notificacion.');
    } finally {
      setProcesando(false);
    }
  };

  const marcarTodas = async () => {
    setProcesando(true);
    try {
      await servicioNotificaciones.marcarTodasLeidas();
      setElementos((actuales) => actuales.map((item) => ({ ...item, leida: true })));
      actualizarContador('notificaciones', 0);
      toast.exito('Todas las notificaciones estan marcadas como leidas.');
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudieron marcar las notificaciones.');
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async (notificacion) => {
    setProcesando(true);
    try {
      await servicioNotificaciones.eliminar(notificacion._id);
      setElementos((actuales) => actuales.filter((item) => item._id !== notificacion._id));
      recargar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo eliminar la notificacion.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Notificaciones</h1>
          <p className="texto-secundario">Reacciones, comentarios, solicitudes y novedades de la comunidad.</p>
        </div>

        <div className="flex gap-2">
          <Boton
            variante={soloNoLeidas ? 'primario' : 'contorno'}
            tamano="pequeno"
            onClick={() => setSoloNoLeidas((valor) => !valor)}
          >
            {soloNoLeidas ? 'Mostrar todas' : 'Solo no leidas'}
          </Boton>
        </div>
      </header>

      {error && !cargando && (
        <EstadoError
          mensaje="No pudimos cargar las notificaciones"
          detalle={error}
          alReintentar={() => cargar(1)}
        />
      )}

      <ListaNotificaciones
        notificaciones={elementos}
        cargando={cargando && elementos.length === 0}
        alMarcarLeida={marcarLeida}
        alEliminar={eliminar}
        alMarcarTodas={marcarTodas}
      />

      {hayMas && (
        <div className="flex justify-center">
          <Boton variante="contorno" cargando={cargando} onClick={() => cargar(pagina + 1)}>
            Cargar mas notificaciones
          </Boton>
        </div>
      )}

      {procesando && <p className="text-center text-xs text-emi-400">Actualizando...</p>}
    </div>
  );
}
