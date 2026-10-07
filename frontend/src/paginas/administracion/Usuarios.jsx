import { useCallback, useEffect, useState } from 'react';
import { Users, Search, Ban, Check, Trash2, ShieldCheck } from 'lucide-react';
import { Avatar } from '../../componentes/comunes/Avatar';
import { Boton } from '../../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../../componentes/comunes/Esqueleto';
import { Campo, Selector } from '../../componentes/comunes/EntradaTexto';
import { ModalConfirmacion } from '../../componentes/comunes/Modal';
import { InsigniaRol } from '../../componentes/comunes/Insignia';
import { useToast } from '../../contexto/ContextoToast';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useDebounce } from '../../hooks/useDebounce';
import { servicioAdministracion } from '../../servicios/servicioAdministracion';
import { ROLES } from '../../constantes/catalogos';
import { nombreCompleto, plural } from '../../utilidades/textos';
import { fechaCorta } from '../../utilidades/fechas';

/** Gestion de usuarios del panel administrativo. */
export default function Usuarios() {
  const toast = useToast();
  const { esAdministrador, usuario: yo } = useAutenticacion();

  const [buscar, setBuscar] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState('');
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [procesando, setProcesando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const buscarRetrasado = useDebounce(buscar, 350);

  const cargar = useCallback(
    async (numeroPagina = 1) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await servicioAdministracion.listarUsuarios({
          pagina: numeroPagina,
          limite: 20,
          buscar: buscarRetrasado.trim() || undefined,
          rol: rol || undefined,
          estado: estado || undefined,
        });
        setElementos((actuales) =>
          numeroPagina === 1 ? datos.usuarios || [] : [...actuales, ...(datos.usuarios || [])]
        );
        setPagina(numeroPagina);
        setHayMas(Boolean(datos.paginacion?.hayPaginaSiguiente));
      } catch (excepcion) {
        setError(excepcion.mensaje || 'No se pudieron cargar los usuarios.');
      } finally {
        setCargando(false);
      }
    },
    [buscarRetrasado, rol, estado]
  );

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  /** Ejecuta una accion administrativa sobre un usuario. */
  const ejecutar = async (clave, funcion, mensajeExito) => {
    setProcesando(clave);
    try {
      await funcion();
      toast.exito(mensajeExito);
      await cargar(1);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo completar la accion.');
    } finally {
      setProcesando(null);
    }
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    await ejecutar(
      `eliminar-${aEliminar._id}`,
      () => servicioAdministracion.eliminarUsuario(aEliminar._id),
      'Usuario eliminado definitivamente.'
    );
    setAEliminar(null);
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="titulo-seccion">Gestion de usuarios</h1>
        <p className="texto-secundario">Busca, modera y administra las cuentas de EMI Connect.</p>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Campo
          etiqueta=""
          valor={buscar}
          alCambiar={setBuscar}
          marcador="Buscar por nombre, correo o carrera..."
          icono={Search}
          className="w-full sm:w-72"
        />
        <Selector
          valor={rol}
          alCambiar={setRol}
          opciones={ROLES}
          marcador="Todos los roles"
          className="w-44"
        />
        <Selector
          valor={estado}
          alCambiar={setEstado}
          opciones={[
            { valor: 'activos', etiqueta: 'No bloqueados' },
            { valor: 'bloqueados', etiqueta: 'Bloqueados' },
            { valor: 'noVerificados', etiqueta: 'Sin verificar' },
          ]}
          marcador="Todos los estados"
          className="w-48"
        />
      </div>

      {/* Contenido */}
      {cargando && elementos.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, indice) => (
            <div key={indice} className="tarjeta flex items-center gap-3 p-4">
              <Esqueleto className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Esqueleto className="h-4 w-1/3" />
                <Esqueleto className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar los usuarios" detalle={error} alReintentar={() => cargar(1)} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio titulo="Sin resultados" descripcion="No hay usuarios que coincidan con los filtros." icono={Users} />
      )}

      {!cargando && !error && elementos.length > 0 && (
        <ul className="space-y-3">
          {elementos.map((usuario) => {
            const esYo = String(usuario._id) === String(yo?._id);

            return (
              <li key={usuario._id} className="tarjeta p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar usuario={usuario} tamanos="normal" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-emi-900 dark:text-emi-50">
                        {nombreCompleto(usuario)}
                      </p>
                      <InsigniaRol rol={usuario.rol} />
                      {usuario.bloqueado && (
                        <span className="insignia bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          Bloqueado
                        </span>
                      )}
                      {!usuario.verificado && (
                        <span className="insignia bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100">
                          Sin verificar
                        </span>
                      )}
                      {usuario.cuentaEliminada && (
                        <span className="insignia bg-gray-200 text-gray-700 dark:bg-emi-800 dark:text-emi-100">
                          Desactivada
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-emi-500">{usuario.correo}</p>
                    <p className="truncate text-[11px] text-emi-400">
                      {usuario.carrera || 'Sin carrera'} · registrado {fechaCorta(usuario.fechaCreacion)} ·{' '}
                      {plural(usuario.cantidadAmigos || 0, 'contacto')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {esAdministrador && !esYo && (
                      <Selector
                        valor={usuario.rol}
                        alCambiar={(nuevoRol) =>
                          ejecutar(
                            `rol-${usuario._id}`,
                            () => servicioAdministracion.cambiarRol(usuario._id, nuevoRol),
                            'Rol actualizado correctamente.'
                          )
                        }
                        opciones={ROLES}
                        className="w-40"
                        deshabilitado={procesando === `rol-${usuario._id}`}
                      />
                    )}

                    {!esYo && (
                      <Boton
                        variante={usuario.bloqueado ? 'secundario' : 'contorno'}
                        tamano="pequeno"
                        icono={usuario.bloqueado ? Check : Ban}
                        cargando={procesando === `bloqueo-${usuario._id}`}
                        onClick={() =>
                          ejecutar(
                            `bloqueo-${usuario._id}`,
                            () =>
                              servicioAdministracion.cambiarBloqueo(
                                usuario._id,
                                !usuario.bloqueado,
                                usuario.bloqueado ? '' : 'Bloqueo administrativo'
                              ),
                            usuario.bloqueado ? 'Usuario desbloqueado.' : 'Usuario bloqueado.'
                          )
                        }
                      >
                        {usuario.bloqueado ? 'Desbloquear' : 'Bloquear'}
                      </Boton>
                    )}

                    {!esYo && (
                      <Boton
                        variante={usuario.activo === false ? 'exito' : 'contorno'}
                        tamano="pequeno"
                        cargando={procesando === `estado-${usuario._id}`}
                        onClick={() =>
                          ejecutar(
                            `estado-${usuario._id}`,
                            () => servicioAdministracion.cambiarEstado(usuario._id, usuario.activo === false),
                            usuario.activo === false ? 'Cuenta habilitada.' : 'Cuenta deshabilitada.'
                          )
                        }
                      >
                        {usuario.activo === false ? 'Habilitar' : 'Deshabilitar'}
                      </Boton>
                    )}

                    {esAdministrador && !esYo && (
                      <Boton
                        variante="peligro"
                        tamano="pequeno"
                        icono={Trash2}
                        onClick={() => setAEliminar(usuario)}
                      >
                        Eliminar
                      </Boton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hayMas && (
        <div className="flex justify-center">
          <Boton variante="contorno" cargando={cargando} onClick={() => cargar(pagina + 1)}>
            Cargar mas usuarios
          </Boton>
        </div>
      )}

      <ModalConfirmacion
        abierto={Boolean(aEliminar)}
        alCerrar={() => setAEliminar(null)}
        alConfirmar={eliminar}
        titulo="Eliminar usuario"
        mensaje={`Se eliminara definitivamente la cuenta de ${aEliminar ? nombreCompleto(aEliminar) : ''} y sus datos de acceso. Esta accion no se puede deshacer.`}
        textoConfirmar="Eliminar"
      />

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-emi-400">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Los cambios de rol y la eliminacion definitiva solo los realiza el administrador principal.
      </p>
    </div>
  );
}
