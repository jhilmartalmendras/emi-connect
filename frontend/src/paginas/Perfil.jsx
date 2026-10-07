import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, ImagePlus, MapPin, CalendarDays, Mail, MessageSquare, UserPlus, UserCheck, Users } from 'lucide-react';
import { Avatar } from '../componentes/comunes/Avatar';
import { Boton } from '../componentes/comunes/Boton';
import { InsigniaRol } from '../componentes/comunes/Insignia';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { EsqueletoLista, Esqueleto } from '../componentes/comunes/Esqueleto';
import { Modal } from '../componentes/comunes/Modal';
import { Campo, AreaTexto } from '../componentes/comunes/EntradaTexto';
import { TarjetaPublicacion } from '../componentes/contenido/TarjetaPublicacion';
import { EditorPublicacion } from '../componentes/contenido/EditorPublicacion';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useToast } from '../contexto/ContextoToast';
import { usePeticion } from '../hooks/usePeticion';
import { servicioUsuarios } from '../servicios/servicioUsuarios';
import { servicioPublicaciones } from '../servicios/servicioPublicaciones';
import { servicioAmistades } from '../servicios/servicioAmistades';
import { servicioMensajes } from '../servicios/servicioMensajes';
import { fechaCorta } from '../utilidades/fechas';
import { nombreCompleto, urlArchivo } from '../utilidades/textos';

/** Perfil de usuario: portada, foto, estadisticas, edicion y publicaciones. */
export default function Perfil() {
  const { id } = useParams();
  const { usuario: yo, actualizarUsuario } = useAutenticacion();
  const toast = useToast();

  const perfilId = id || yo?._id;
  const esPropio = yo && String(perfilId) === String(yo._id);

  const consulta = usePeticion(() => servicioUsuarios.obtenerPerfil(perfilId), [perfilId]);
  const perfil = consulta.datos;
  const persona = perfil?.usuario;

  const [publicaciones, setPublicaciones] = useState([]);
  const [cargandoPublicaciones, setCargandoPublicaciones] = useState(true);
  const [errorPublicaciones, setErrorPublicaciones] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [editando, setEditando] = useState(false);
  const [solicitando, setSolicitando] = useState(false);

  const archivoFoto = useRef(null);
  const archivoPortada = useRef(null);

  /** Carga las publicaciones del perfil. */
  const cargarPublicaciones = async (numeroPagina = 1) => {
    setCargandoPublicaciones(true);
    setErrorPublicaciones(null);
    try {
      const datos = await servicioPublicaciones.listarPorUsuario(perfilId, numeroPagina, 10);
      setPublicaciones((actuales) =>
        numeroPagina === 1 ? datos.publicaciones || [] : [...actuales, ...(datos.publicaciones || [])]
      );
      setPagina(numeroPagina);
      setHayMas(Boolean(datos.paginacion?.hayPaginaSiguiente));
    } catch (error) {
      setErrorPublicaciones(error.mensaje || 'No se pudieron cargar las publicaciones.');
    } finally {
      setCargandoPublicaciones(false);
    }
  };

  useEffect(() => {
    setPublicaciones([]);
    cargarPublicaciones(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfilId]);

  /** Sube la foto de perfil (solo el propio usuario). */
  const subirFoto = async (eventos) => {
    const archivo = eventos.target.files?.[0];
    eventos.target.value = '';
    if (!archivo) return;
    try {
      const resultado = await servicioUsuarios.subirFotoPerfil(archivo);
      actualizarUsuario({ fotoPerfil: resultado.ruta });
      toast.exito('Foto de perfil actualizada.');
      consulta.recargar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo actualizar la foto.');
    }
  };

  /** Sube la portada (solo el propio usuario). */
  const subirPortada = async (eventos) => {
    const archivo = eventos.target.files?.[0];
    eventos.target.value = '';
    if (!archivo) return;
    try {
      const resultado = await servicioUsuarios.subirFotoPortada(archivo);
      actualizarUsuario({ fotoPortada: resultado.ruta });
      toast.exito('Portada actualizada.');
      consulta.recargar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo actualizar la portada.');
    }
  };

  /** Envia o gestiona la solicitud de amistad. */
  const gestionarAmistad = async () => {
    if (!perfil?.amistad) {
      setSolicitando(true);
      try {
        await servicioAmistades.enviarSolicitud(perfilId);
        toast.exito('Solicitud de amistad enviada.');
        consulta.recargar();
      } catch (error) {
        toast.error(error.mensaje || 'No se pudo enviar la solicitud.');
      } finally {
        setSolicitando(false);
      }
      return;
    }

    const { estado, esSolicitante } = perfil.amistad;
    setSolicitando(true);
    try {
      if (estado === 'aceptada') {
        await servicioAmistades.eliminarAmistad(perfilId);
        toast.informativo('Contacto eliminado.');
      } else if (estado === 'pendiente') {
        // Se busca el identificador de la relacion para aceptar o cancelar.
        const datos = esSolicitante
          ? await servicioAmistades.listarEnviadas(1, 50)
          : await servicioAmistades.listarRecibidas(1, 50);
        const relacion = (datos.solicitudes || []).find((item) => {
          const otraPersona = esSolicitante ? item.receptor : item.solicitante;
          return String(otraPersona?._id || otraPersona) === String(perfilId);
        });

        if (relacion) {
          if (esSolicitante) {
            await servicioAmistades.cancelarSolicitud(relacion._id);
            toast.informativo('Solicitud cancelada.');
          } else {
            await servicioAmistades.aceptarSolicitud(relacion._id);
            toast.exito('Solicitud aceptada. ¡Ahora son contactos!');
          }
        }
      }
      consulta.recargar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo completar la accion.');
    } finally {
      setSolicitando(false);
    }
  };

  /** Abre una conversacion directa con la persona. */
  const escribirMensaje = async () => {
    try {
      const datos = await servicioMensajes.abrirConversacion(perfilId);
      window.location.assign(`/mensajes/${datos.conversacion._id}`);
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo abrir la conversacion.');
    }
  };

  if (consulta.cargando) {
    return (
      <div className="space-y-4">
        <div className="tarjeta overflow-hidden">
          <Esqueleto className="h-40 w-full rounded-none" />
          <div className="flex items-end gap-4 px-6 pb-6">
            <Esqueleto className="-mt-14 h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-2 py-4">
              <Esqueleto className="h-5 w-56" />
              <Esqueleto className="h-3.5 w-72" />
            </div>
          </div>
        </div>
        <EsqueletoLista cantidad={2} />
      </div>
    );
  }

  if (consulta.error || !persona) {
    return <EstadoError mensaje="No pudimos cargar este perfil" detalle={consulta.error || ''} alReintentar={consulta.recargar} />;
  }

  if (perfil.bloqueado) {
    return (
      <EstadoVacio
        titulo="Perfil no disponible"
        descripcion="No puedes ver el perfil de este usuario porque existe un bloqueo activo."
        icono={Users}
      />
    );
  }

  const amistad = perfil.amistad;
  let etiquetaAmistad = 'Agregar contacto';
  if (amistad?.estado === 'pendiente' && amistad.esSolicitante) etiquetaAmistad = 'Cancelar solicitud';
  else if (amistad?.estado === 'pendiente') etiquetaAmistad = 'Aceptar solicitud';
  else if (amistad?.estado === 'aceptada') etiquetaAmistad = 'Contactos ✓';

  return (
    <div className="space-y-4">
      {/* Cabecera del perfil */}
      <section className="tarjeta overflow-hidden">
        {/* Portada */}
        <div className="relative h-40 bg-gradient-to-br from-emi-700 via-emi-800 to-emi-950 sm:h-52">
          {(persona.fotoPortada || yo?.fotoPortada) && (
            <img
              src={urlArchivo(persona.fotoPortada)}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          {esPropio && (
            <>
              <input ref={archivoPortada} type="file" accept="image/*" onChange={subirPortada} className="hidden" />
              <button
                type="button"
                onClick={() => archivoPortada.current && archivoPortada.current.click()}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-black/70"
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                Cambiar portada
              </button>
            </>
          )}
        </div>

        <div className="relative px-4 pb-4 sm:px-6">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end">
            {/* Foto */}
            <div className="relative self-start">
              <Avatar usuario={persona} tamanos="perfil" anillo />
              {esPropio && (
                <>
                  <input ref={archivoFoto} type="file" accept="image/*" onChange={subirFoto} className="hidden" />
                  <button
                    type="button"
                    onClick={() => archivoFoto.current && archivoFoto.current.click()}
                    className="absolute bottom-1 right-1 rounded-full bg-emi-700 p-2 text-white shadow transition hover:bg-emi-600"
                    aria-label="Cambiar foto de perfil"
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {/* Datos */}
            <div className="flex-1 pt-2 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-emi-900 dark:text-emi-50">{nombreCompleto(persona)}</h1>
                <InsigniaRol rol={persona.rol} />
              </div>
              <p className="texto-secundario">
                {persona.carrera}
                {persona.semestre ? ` · ${persona.semestre}° semestre` : ''}
              </p>
              {persona.descripcion && <p className="mt-1 text-sm text-emi-600 dark:text-emi-200">{persona.descripcion}</p>}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pb-2">
              {esPropio ? (
                <Boton variante="contorno" onClick={() => setEditando(true)}>
                  Editar perfil
                </Boton>
              ) : (
                <>
                  <Boton
                    variante={amistad?.estado === 'aceptada' ? 'secundario' : 'primario'}
                    icono={amistad?.estado === 'aceptada' ? UserCheck : UserPlus}
                    onClick={gestionarAmistad}
                    cargando={solicitando}
                  >
                    {etiquetaAmistad}
                  </Boton>
                  <Boton variante="contorno" icono={MessageSquare} onClick={escribirMensaje}>
                    Mensaje
                  </Boton>
                </>
              )}
            </div>
          </div>

          {/* Estadisticas */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-emi-100 pt-4 text-sm dark:border-emi-800">
            <span className="text-emi-500 dark:text-emi-300">
              <strong className="text-emi-900 dark:text-emi-50">{persona.cantidadPublicaciones ?? 0}</strong>{' '}
              publicaciones
            </span>
            <span className="text-emi-500 dark:text-emi-300">
              <strong className="text-emi-900 dark:text-emi-50">
                {persona.cantidadAmigos == null ? '—' : persona.cantidadAmigos}
              </strong>{' '}
              contactos
            </span>
            <span className="text-emi-500 dark:text-emi-300">
              <strong className="text-emi-900 dark:text-emi-50">{persona.cantidadComunidades ?? 0}</strong> comunidades
            </span>
            {esPropio && (
              <span className="text-emi-500 dark:text-emi-300">
                <strong className="text-emi-900 dark:text-emi-50">{persona.cantidadGuardados ?? 0}</strong> guardados
              </span>
            )}
          </div>

          {/* Datos de contacto */}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-emi-400">
            {persona.unidadAcademica && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {persona.unidadAcademica}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Miembro desde {fechaCorta(persona.fechaCreacion)}
            </span>
            {persona.correo && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {persona.correo}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Publicaciones */}
      {esPropio && (
        <EditorPublicacion
          alCrear={(nueva) => setPublicaciones((actuales) => [nueva, ...actuales])}
          placeholder="¿Que estas pensando?"
        />
      )}

      {cargandoPublicaciones && publicaciones.length === 0 && <EsqueletoLista cantidad={2} />}

      {errorPublicaciones && !cargandoPublicaciones && (
        <EstadoError
          mensaje="No pudimos cargar las publicaciones"
          detalle={errorPublicaciones}
          alReintentar={() => cargarPublicaciones(1)}
        />
      )}

      {!cargandoPublicaciones && !errorPublicaciones && publicaciones.length === 0 && (
        <EstadoVacio
          titulo={esPropio ? 'Aun no has publicado' : 'Este perfil no tiene publicaciones'}
          descripcion={esPropio ? 'Comparte tu primera idea con la comunidad EMI.' : 'Vuelve mas tarde.'}
        />
      )}

      {publicaciones.map((publicacion) => (
        <TarjetaPublicacion
          key={publicacion._id}
          publicacion={publicacion}
          alCambiar={() => cargarPublicaciones(1)}
          alEliminar={(id) => setPublicaciones((actuales) => actuales.filter((item) => item._id !== id))}
        />
      ))}

      {hayMas && (
        <div className="flex justify-center">
          <Boton variante="contorno" cargando={cargandoPublicaciones} onClick={() => cargarPublicaciones(pagina + 1)}>
            Cargar mas publicaciones
          </Boton>
        </div>
      )}

      {/* Modal de edicion */}
      {esPropio && (
        <ModalEdicionPerfil
          abierto={editando}
          alCerrar={() => setEditando(false)}
          persona={persona}
          alGuardar={() => {
            setEditando(false);
            consulta.recargar();
          }}
          actualizarUsuario={actualizarUsuario}
        />
      )}
    </div>
  );
}

/** Formulario de edicion de los datos del perfil propio. */
function ModalEdicionPerfil({ abierto, alCerrar, persona, alGuardar, actualizarUsuario }) {
  const toast = useToast();
  const [formulario, setFormulario] = useState({
    nombres: persona?.nombres || '',
    apellidos: persona?.apellidos || '',
    carrera: persona?.carrera || '',
    semestre: persona?.semestre || '',
    unidadAcademica: persona?.unidadAcademica || '',
    descripcion: persona?.descripcion || '',
    intereses: (persona?.intereses || []).join(', '),
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (persona) {
      setFormulario({
        nombres: persona.nombres || '',
        apellidos: persona.apellidos || '',
        carrera: persona.carrera || '',
        semestre: persona.semestre || '',
        unidadAcademica: persona.unidadAcademica || '',
        descripcion: persona.descripcion || '',
        intereses: (persona.intereses || []).join(', '),
      });
    }
  }, [persona]);

  const cambiar = (clave) => (valor) => setFormulario((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async () => {
    if (formulario.nombres.trim().length < 2 || formulario.apellidos.trim().length < 2) {
      toast.error('Nombres y apellidos son obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await servicioUsuarios.actualizarMiPerfil({
        nombres: formulario.nombres.trim(),
        apellidos: formulario.apellidos.trim(),
        carrera: formulario.carrera.trim(),
        semestre: formulario.semestre ? Number(formulario.semestre) : undefined,
        unidadAcademica: formulario.unidadAcademica,
        descripcion: formulario.descripcion.trim(),
        intereses: formulario.intereses
          .split(',')
          .map((interes) => interes.trim())
          .filter(Boolean),
      });
      actualizarUsuario(resultado.usuario);
      toast.exito('Perfil actualizado correctamente.');
      alGuardar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Editar perfil"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombres" valor={formulario.nombres} alCambiar={cambiar('nombres')} requerido />
          <Campo etiqueta="Apellidos" valor={formulario.apellidos} alCambiar={cambiar('apellidos')} requerido />
        </div>

        <Campo etiqueta="Carrera" valor={formulario.carrera} alCambiar={cambiar('carrera')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Semestre"
            tipo="number"
            valor={formulario.semestre}
            alCambiar={cambiar('semestre')}
            min={1}
            max={12}
          />
          <Campo
            etiqueta="Unidad academica"
            valor={formulario.unidadAcademica}
            alCambiar={cambiar('unidadAcademica')}
            marcador="Ej. LA_PAZ"
          />
        </div>

        <AreaTexto
          etiqueta="Descripcion"
          valor={formulario.descripcion}
          alCambiar={cambiar('descripcion')}
          filas={3}
          maxLength={400}
          ayuda="Cuentale a la comunidad que te gusta estudiar o investigar."
        />

        <Campo
          etiqueta="Intereses"
          valor={formulario.intereses}
          alCambiar={cambiar('intereses')}
          marcador="IA, Robotica, Redes..."
          ayuda="Separa cada interes con una coma."
        />
      </div>
    </Modal>
  );
}
