import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UsersRound, Lock, Globe, LogOut, UserPlus, Check, X, Shield } from 'lucide-react';
import { Avatar } from '../componentes/comunes/Avatar';
import { Boton } from '../componentes/comunes/Boton';
import { Insignia, InsigniaRol } from '../componentes/comunes/Insignia';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto, EsqueletoLista } from '../componentes/comunes/Esqueleto';
import { TarjetaPublicacion } from '../componentes/contenido/TarjetaPublicacion';
import { EditorPublicacion } from '../componentes/contenido/EditorPublicacion';
import { useToast } from '../contexto/ContextoToast';
import { servicioComunidades } from '../servicios/servicioComunidades';
import { servicioPublicaciones } from '../servicios/servicioPublicaciones';
import { colorCategoria, etiquetaCategoria } from '../constantes/catalogos';
import { plural, urlArchivo } from '../utilidades/textos';

/** Detalle de una comunidad: informacion, miembros, solicitudes y publicaciones. */
export default function DetalleComunidad() {
  const { id } = useParams();
  const toast = useToast();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargandoPublicaciones, setCargandoPublicaciones] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [accionEnCurso, setAccionEnCurso] = useState(false);

  const comunidad = datos?.comunidad;
  const miembros = datos?.miembros || [];

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await servicioComunidades.obtener(id);
      setDatos(resultado);
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudo cargar la comunidad.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  const cargarPublicaciones = useCallback(async () => {
    setCargandoPublicaciones(true);
    try {
      const resultado = await servicioPublicaciones.listarPorComunidad(id, 1, 15);
      setPublicaciones(resultado.publicaciones || []);
    } catch (excepcion) {
      setPublicaciones([]);
    } finally {
      setCargandoPublicaciones(false);
    }
  }, [id]);

  const cargarSolicitudes = useCallback(async () => {
    if (!datos?.comunidad?.puedoAdministrar || !datos.comunidad.esPrivada) {
      setSolicitudes([]);
      return;
    }
    try {
      const resultado = await servicioComunidades.listarSolicitudes(id);
      setSolicitudes(resultado.solicitudes || []);
    } catch (excepcion) {
      setSolicitudes([]);
    }
  }, [id, datos]);

  useEffect(() => {
    cargar();
    cargarPublicaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  /** Se une o sale de la comunidad. */
  const alternarMembresia = async () => {
    setAccionEnCurso(true);
    try {
      const resultado = comunidad.soyMiembro
        ? await servicioComunidades.salir(id)
        : await servicioComunidades.unirse(id);
      toast.exito(resultado?.mensaje || 'Membresia actualizada.');
      cargar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo completar la accion.');
    } finally {
      setAccionEnCurso(false);
    }
  };

  /** Aprueba o rechaza una solicitud de ingreso. */
  const gestionar = async (miembroId, accion) => {
    setAccionEnCurso(true);
    try {
      const resultado = await servicioComunidades.gestionarSolicitud(id, miembroId, accion);
      toast.exito(resultado?.mensaje || 'Solicitud gestionada.');
      cargarSolicitudes();
      cargar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo gestionar la solicitud.');
    } finally {
      setAccionEnCurso(false);
    }
  };

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="tarjeta overflow-hidden">
          <Esqueleto className="h-36 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Esqueleto className="h-5 w-64" />
            <Esqueleto className="h-4 w-full" />
            <Esqueleto className="h-4 w-2/3" />
          </div>
        </div>
        <EsqueletoLista cantidad={2} />
      </div>
    );
  }

  if (error || !comunidad) {
    return (
      <EstadoError
        mensaje="No pudimos cargar esta comunidad"
        detalle={error || 'Puede que haya sido desactivada.'}
        alReintentar={cargar}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <section className="tarjeta overflow-hidden">
        <div className="h-36 bg-gradient-to-br from-emi-700 via-emi-800 to-emi-950">
          {comunidad.portada && (
            <img src={urlArchivo(comunidad.portada)} alt="" className="h-36 w-full object-cover" />
          )}
        </div>

        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-emi-700 text-white shadow-suave dark:border-emi-900">
                {comunidad.imagen ? (
                  <img src={urlArchivo(comunidad.imagen)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UsersRound className="h-8 w-8" aria-hidden="true" />
                )}
              </span>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-emi-900 dark:text-emi-50">{comunidad.nombre}</h1>
                  <Insignia className={colorCategoria(comunidad.categoria)}>
                    {etiquetaCategoria(comunidad.categoria)}
                  </Insignia>
                  {comunidad.esPrivada ? (
                    <Insignia className="bg-emi-100 text-emi-700 dark:bg-emi-800 dark:text-emi-100" icono={Lock}>
                      Privada
                    </Insignia>
                  ) : (
                    <Insignia className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" icono={Globe}>
                      Publica
                    </Insignia>
                  )}
                  {comunidad.puedoAdministrar && (
                    <Insignia className="bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100" icono={Shield}>
                      Admin
                    </Insignia>
                  )}
                </div>
                <p className="mt-1 text-sm text-emi-500 dark:text-emi-300">
                  {plural(comunidad.cantidadMiembros || 0, 'miembro')} ·{' '}
                  {plural(comunidad.cantidadPublicaciones || 0, 'publicacion', 'publicaciones')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pb-1">
              {comunidad.soyMiembro ? (
                <Boton variante="contorno" icono={LogOut} onClick={alternarMembresia} cargando={accionEnCurso}>
                  Salir de la comunidad
                </Boton>
              ) : (
                <Boton variante="primario" icono={UserPlus} onClick={alternarMembresia} cargando={accionEnCurso}>
                  {comunidad.esPrivada ? 'Solicitar ingreso' : 'Unirse'}
                </Boton>
              )}
            </div>
          </div>

          {comunidad.descripcion && (
            <p className="mt-4 text-sm leading-relaxed text-emi-700 dark:text-emi-100">{comunidad.descripcion}</p>
          )}

          {comunidad.reglas && comunidad.reglas.length > 0 && (
            <div className="mt-3 rounded-xl bg-emi-50 px-4 py-3 dark:bg-emi-800/60">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emi-500 dark:text-emi-300">
                Reglas de la comunidad
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-emi-700 dark:text-emi-100">
                {comunidad.reglas.map((regla, indice) => (
                  <li key={indice}>{regla}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Solicitudes pendientes (solo administradores de comunidades privadas) */}
      {solicitudes.length > 0 && (
        <section className="tarjeta p-4" aria-labelledby="solicitudes-comunidad">
          <h2 id="solicitudes-comunidad" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
            Solicitudes de ingreso ({solicitudes.length})
          </h2>
          <ul className="space-y-2">
            {solicitudes.map((solicitud) => {
              const persona = solicitud.usuario || solicitud;
              return (
                <li key={solicitud._id} className="flex items-center gap-3 rounded-xl border border-emi-100 px-3 py-2 dark:border-emi-800">
                  <Avatar usuario={persona} tamanos="pequeno" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/perfil/${persona._id}`} className="truncate text-sm font-medium text-emi-900 hover:underline dark:text-emi-50">
                      {`${persona.nombres || ''} ${persona.apellidos || ''}`.trim()}
                    </Link>
                    {solicitud.mensaje && <p className="truncate text-xs text-emi-500">{solicitud.mensaje}</p>}
                  </div>
                  <Boton
                    variante="exito"
                    tamano="pequeno"
                    icono={Check}
                    onClick={() => gestionar(solicitud._id, 'aprobar')}
                    cargando={accionEnCurso}
                  >
                    Aprobar
                  </Boton>
                  <Boton
                    variante="contorno"
                    tamano="pequeno"
                    icono={X}
                    onClick={() => gestionar(solicitud._id, 'rechazar')}
                    cargando={accionEnCurso}
                  >
                    Rechazar
                  </Boton>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Miembros */}
      <section className="tarjeta p-4" aria-labelledby="miembros-comunidad">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="miembros-comunidad" className="text-sm font-semibold text-emi-900 dark:text-emi-50">
            Miembros destacados
          </h2>
          <span className="text-xs text-emi-400">{plural(comunidad.cantidadMiembros || 0, 'miembro')}</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {miembros.map((miembro) => {
            const persona = miembro.usuario || miembro;
            return (
              <Link
                key={miembro._id || persona._id}
                to={`/perfil/${persona._id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-emi-50 dark:hover:bg-emi-800"
              >
                <Avatar usuario={persona} tamanos="pequeno" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-emi-900 dark:text-emi-50">
                    {`${persona.nombres || ''} ${persona.apellidos || ''}`.trim()}
                  </span>
                  <span className="block truncate text-xs text-emi-500">{persona.carrera}</span>
                </span>
                <InsigniaRol rol={miembro.rol || persona.rol} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Publicaciones de la comunidad */}
      {comunidad.soyMiembro ? (
        <EditorPublicacion
          comunidad={comunidad}
          placeholder={`Publica en ${comunidad.nombre}...`}
          alCrear={(nueva) => setPublicaciones((actuales) => [nueva, ...actuales])}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-emi-200 px-4 py-3 text-center text-sm text-emi-500 dark:border-emi-700 dark:text-emi-300">
          Unete a la comunidad para ver y publicar contenido en su muro.
        </p>
      )}

      {cargandoPublicaciones && <EsqueletoLista cantidad={2} />}

      {!cargandoPublicaciones && publicaciones.length === 0 && (
        <EstadoVacio
          titulo="Sin publicaciones"
          descripcion={
            comunidad.soyMiembro
              ? 'Sé el primero en publicar en esta comunidad.'
              : 'Las publicaciones de la comunidad estan disponibles para sus miembros.'
          }
        />
      )}

      {publicaciones.map((publicacion) => (
        <TarjetaPublicacion
          key={publicacion._id}
          publicacion={publicacion}
          alCambiar={cargarPublicaciones}
          alEliminar={(publicacionId) =>
            setPublicaciones((actuales) => actuales.filter((item) => item._id !== publicacionId))
          }
        />
      ))}
    </div>
  );
}
