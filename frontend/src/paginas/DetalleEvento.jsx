import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Pencil, Trash2, Flag, Ban, ExternalLink } from 'lucide-react';
import { Avatar } from '../componentes/comunes/Avatar';
import { Boton } from '../componentes/comunes/Boton';
import { Insignia } from '../componentes/comunes/Insignia';
import { EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { Modal, ModalConfirmacion } from '../componentes/comunes/Modal';
import { Campo, AreaTexto, Selector, Casilla } from '../componentes/comunes/EntradaTexto';
import { ModalReporte } from '../componentes/comunes/ModalReporte';
import { useToast } from '../contexto/ContextoToast';
import { servicioEventos } from '../servicios/servicioEventos';
import { ESTADOS_ASISTENCIA, CATEGORIAS_PUBLICACION } from '../constantes/catalogos';
import { fechaCompleta, fechaCorta, horaCorta, paraInputFecha, tiempoHasta, yaPaso } from '../utilidades/fechas';
import { nombreCompleto, plural, urlArchivo } from '../utilidades/textos';

/** Detalle del evento: informacion, asistencia, asistentes y gestion. */
export default function DetalleEvento() {
  const { id } = useParams();
  const toast = useToast();
  const navegar = useNavigate();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [reportando, setReportando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await servicioEventos.obtener(id);
      setDatos(resultado);
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudo cargar el evento.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const evento = datos?.evento;

  /** Registra o cambia la asistencia del usuario. */
  const asistir = async (estado) => {
    setConfirmando(true);
    try {
      const resultado = await servicioEventos.confirmarAsistencia(id, estado);
      toast.exito(resultado?.mensaje || 'Asistencia actualizada.');
      cargar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo registrar la asistencia.');
    } finally {
      setConfirmando(false);
    }
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      await servicioEventos.eliminar(id);
      toast.exito('Evento eliminado.');
      navegar('/eventos');
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo eliminar el evento.');
      setEliminando(false);
    }
  };

  if (cargando) {
    return (
      <div className="tarjeta overflow-hidden">
        <Esqueleto className="h-52 w-full rounded-none" />
        <div className="space-y-3 p-5">
          <Esqueleto className="h-5 w-2/3" />
          <Esqueleto className="h-4 w-1/2" />
          <Esqueleto className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return <EstadoError mensaje="No pudimos cargar el evento" detalle={error || ''} alReintentar={cargar} />;
  }

  const paso = yaPaso(evento.fecha);
  const miAsistencia = datos.miAsistencia;
  const asistentes = datos.asistentes || [];

  return (
    <div className="space-y-4">
      <section className="tarjeta overflow-hidden">
        {/* Portada */}
        <div className="h-48 bg-gradient-to-br from-emi-700 via-emi-800 to-emi-950 sm:h-56">
          {evento.imagen && <img src={urlArchivo(evento.imagen)} alt="" className="h-48 w-full object-cover sm:h-56" />}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-emi-900 dark:text-emi-50">{evento.nombre}</h1>
                {evento.cancelado && (
                  <Insignia className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Cancelado</Insignia>
                )}
                {evento.esInstitucional && (
                  <Insignia className="bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100">
                    Institucional
                  </Insignia>
                )}
                {paso && !evento.cancelado && (
                  <Insignia className="bg-emi-100 text-emi-700 dark:bg-emi-800 dark:text-emi-100">Finalizado</Insignia>
                )}
              </div>

              <div className="mt-2 space-y-1 text-sm text-emi-500 dark:text-emi-300">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {fechaCompleta(evento.fecha)}
                  {!paso && <span className="font-medium text-dorado-600">· {tiempoHasta(evento.fecha)}</span>}
                </p>
                {evento.ubicacion && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {evento.ubicacion}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {evento.cupos > 0
                    ? `${plural(evento.cantidadAsistentes || 0, 'asistente')} de ${evento.cupos} cupos`
                    : `${plural(evento.cantidadAsistentes || 0, 'asistente')} confirmado`}
                  {evento.cantidadInteresados > 0 && ` · ${plural(evento.cantidadInteresados, 'interesado')}`}
                </p>
              </div>

              <p className="mt-2 text-xs text-emi-400">
                Organizado por{' '}
                <Link to={`/perfil/${evento.organizador?._id}`} className="font-medium text-emi-600 hover:underline dark:text-emi-300">
                  {nombreCompleto(evento.organizador)}
                </Link>
                {evento.comunidad && (
                  <>
                    {' '}· en{' '}
                    <Link to={`/comunidades/${evento.comunidad._id || evento.comunidad}`} className="font-medium text-emi-600 hover:underline dark:text-emi-300">
                      {evento.comunidad.nombre || 'una comunidad'}
                    </Link>
                  </>
                )}
              </p>
            </div>

            {/* Acciones del organizador */}
            {evento.esOrganizador && (
              <div className="flex gap-2">
                <Boton variante="contorno" tamano="pequeno" icono={Pencil} onClick={() => setEditando(true)}>
                  Editar
                </Boton>
                <Boton variante="peligro" tamano="pequeno" icono={Trash2} onClick={() => setEliminando(true)}>
                  Eliminar
                </Boton>
              </div>
            )}
          </div>

          {/* Confirmacion de asistencia */}
          {!evento.esOrganizador && (
            <div className="mt-4 flex flex-wrap gap-2">
              {ESTADOS_ASISTENCIA.map((estado) => (
                <Boton
                  key={estado.valor}
                  variante={
                    miAsistencia === estado.valor
                      ? estado.valor === 'asistire'
                        ? 'exito'
                        : estado.valor === 'interesado'
                        ? 'dorado'
                        : 'secundario'
                      : 'contorno'
                  }
                  onClick={() => asistir(estado.valor)}
                  cargando={confirmando}
                  deshabilitado={evento.cancelado}
                >
                  {miAsistencia === estado.valor ? '✓ ' : ''}
                  {estado.etiqueta}
                </Boton>
              ))}

              {!evento.esOrganizador && (
                <Boton variante="sutil" tamano="pequeno" icono={Flag} onClick={() => setReportando(true)}>
                  Reportar
                </Boton>
              )}
            </div>
          )}

          {evento.esOrganizador && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Boton
                variante={evento.cancelado ? 'exito' : 'peligro'}
                icono={evento.cancelado ? ExternalLink : Ban}
                onClick={async () => {
                  try {
                    await servicioEventos.actualizar(id, { cancelado: !evento.cancelado });
                    toast.exito(evento.cancelado ? 'Evento reactivado.' : 'Evento cancelado.');
                    cargar();
                  } catch (excepcion) {
                    toast.error(excepcion.mensaje || 'No se pudo actualizar el evento.');
                  }
                }}
              >
                {evento.cancelado ? 'Reactivar evento' : 'Cancelar evento'}
              </Boton>
            </div>
          )}

          {/* Descripcion */}
          {evento.descripcion && (
            <div className="mt-4 border-t border-emi-100 pt-4 dark:border-emi-800">
              <h2 className="mb-1.5 text-sm font-semibold text-emi-900 dark:text-emi-50">Descripcion</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-emi-700 dark:text-emi-100">
                {evento.descripcion}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Asistentes */}
      <section className="tarjeta p-5" aria-labelledby="titulo-asistentes">
        <h2 id="titulo-asistentes" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
          Asistentes ({asistentes.length})
        </h2>
        {asistentes.length === 0 ? (
          <p className="texto-secundario">Todavia nadie confirmo su asistencia. ¡Se el primero!</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {asistentes.map((asistente) => (
              <Link
                key={asistente._id}
                to={`/perfil/${asistente._id}`}
                className="flex items-center gap-2 rounded-full border border-emi-100 py-1 pl-1 pr-3 transition hover:bg-emi-50 dark:border-emi-800 dark:hover:bg-emi-800"
                title={nombreCompleto(asistente)}
              >
                <Avatar usuario={asistente} tamanos="pequeno" />
                <span className="max-w-[140px] truncate text-xs font-medium text-emi-700 dark:text-emi-100">
                  {nombreCompleto(asistente)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Modal de edicion (organizador) */}
      {evento.esOrganizador && (
        <ModalEdicionEvento
          abierto={editando}
          alCerrar={() => setEditando(false)}
          evento={evento}
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
        titulo="Eliminar evento"
        mensaje="El evento y sus asistencias se eliminaran de forma permanente."
        textoConfirmar="Eliminar"
        cargando={eliminando}
      />

      <ModalReporte
        abierto={reportando}
        alCerrar={() => setReportando(false)}
        tipo="evento"
        objetivoId={evento._id}
        descripcionObjetivo={evento.nombre}
      />
    </div>
  );
}

/** Formulario de edicion del evento para su organizador. */
function ModalEdicionEvento({ abierto, alCerrar, evento, alGuardar }) {
  const toast = useToast();
  const [formulario, setFormulario] = useState({
    nombre: evento.nombre || '',
    descripcion: evento.descripcion || '',
    fecha: paraInputFecha(evento.fecha),
    ubicacion: evento.ubicacion || '',
    categoria: evento.categoria || 'general',
    cupos: evento.cupos || 0,
    cancelado: Boolean(evento.cancelado),
  });
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave) => (valor) => setFormulario((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async () => {
    if (formulario.nombre.trim().length < 4) {
      toast.error('El nombre del evento debe tener al menos 4 caracteres.');
      return;
    }

    setGuardando(true);
    try {
      await servicioEventos.actualizar(evento._id, {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
        fecha: new Date(formulario.fecha).toISOString(),
        ubicacion: formulario.ubicacion.trim(),
        categoria: formulario.categoria,
        cupos: Number(formulario.cupos) || 0,
        cancelado: formulario.cancelado,
      });
      toast.exito('Evento actualizado correctamente.');
      alGuardar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo actualizar el evento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Editar evento"
      tamanos="normal"
      bloquearCierre={guardando}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={guardando}>
            Cancelar
          </Boton>
          <Boton variante="primario" onClick={guardar} cargando={guardando}>
            Guardar cambios
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo etiqueta="Nombre" valor={formulario.nombre} alCambiar={cambiar('nombre')} requerido maxLength={160} />
        <AreaTexto
          etiqueta="Descripcion"
          valor={formulario.descripcion}
          alCambiar={cambiar('descripcion')}
          filas={3}
          maxLength={2000}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Fecha y hora" tipo="datetime-local" valor={formulario.fecha} alCambiar={cambiar('fecha')} requerido />
          <Campo etiqueta="Ubicacion" valor={formulario.ubicacion} alCambiar={cambiar('ubicacion')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Selector
            etiqueta="Categoria"
            valor={formulario.categoria}
            alCambiar={cambiar('categoria')}
            opciones={CATEGORIAS_PUBLICACION.map((item) => ({ valor: item.valor, etiqueta: item.etiqueta }))}
          />
          <Campo etiqueta="Cupos" tipo="number" valor={formulario.cupos} alCambiar={cambiar('cupos')} min={0} />
        </div>
        <Casilla
          etiqueta="Evento cancelado"
          valor={formulario.cancelado}
          alCambiar={cambiar('cancelado')}
          ayuda="Se mantendra visible pero marcado como cancelado."
        />
        <p className="text-xs text-emi-400">
          Creado el {fechaCorta(evento.fechaCreacion)} a las {horaCorta(evento.fechaCreacion)}.
        </p>
      </div>
    </Modal>
  );
}
