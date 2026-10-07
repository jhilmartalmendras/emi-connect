import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Check, X, Ban } from 'lucide-react';
import { Avatar } from '../../componentes/comunes/Avatar';
import { Boton } from '../../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../../componentes/comunes/Esqueleto';
import { Selector, AreaTexto } from '../../componentes/comunes/EntradaTexto';
import { Modal } from '../../componentes/comunes/Modal';
import { Insignia } from '../../componentes/comunes/Insignia';
import { useToast } from '../../contexto/ContextoToast';
import { servicioReportes } from '../../servicios/servicioReportes';
import { ESTADOS_REPORTE, MOTIVOS_REPORTE } from '../../constantes/catalogos';
import { nombreCompleto, recortar } from '../../utilidades/textos';
import { tiempoRelativo } from '../../utilidades/fechas';

/** Revision de reportes del panel administrativo. */
export default function Reportes() {
  const toast = useToast();

  const [estado, setEstado] = useState('pendiente');
  const [tipo, setTipo] = useState('');
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [reporteActivo, setReporteActivo] = useState(null);

  const cargar = useCallback(
    async (numeroPagina = 1) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await servicioReportes.listar({
          pagina: numeroPagina,
          limite: 20,
          estado: estado || undefined,
          tipo: tipo || undefined,
        });
        setElementos((actuales) =>
          numeroPagina === 1 ? datos.reportes || [] : [...actuales, ...(datos.reportes || [])]
        );
        setPagina(numeroPagina);
        setHayMas(Boolean(datos.paginacion?.hayPaginaSiguiente));
      } catch (excepcion) {
        setError(excepcion.mensaje || 'No se pudieron cargar los reportes.');
      } finally {
        setCargando(false);
      }
    },
    [estado, tipo]
  );

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  const colorEstado = (valor) =>
    (ESTADOS_REPORTE.find((item) => item.valor === valor) || ESTADOS_REPORTE[0]).color;

  const etiquetaEstado = (valor) =>
    (ESTADOS_REPORTE.find((item) => item.valor === valor) || ESTADOS_REPORTE[0]).etiqueta;

  const etiquetaTipo = (valor) => `${valor.charAt(0).toUpperCase()}${valor.slice(1)}`;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="titulo-seccion">Revision de reportes</h1>
        <p className="texto-secundario">Atiende las denuncias de la comunidad y toma medidas.</p>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Selector
          valor={estado}
          alCambiar={setEstado}
          opciones={[{ valor: '', etiqueta: 'Todos los estados' }, ...ESTADOS_REPORTE]}
          marcador="Todos los estados"
          className="w-48"
        />
        <Selector
          valor={tipo}
          alCambiar={setTipo}
          opciones={[
            { valor: '', etiqueta: 'Todos los tipos' },
            { valor: 'publicacion', etiqueta: 'Publicaciones' },
            { valor: 'comentario', etiqueta: 'Comentarios' },
            { valor: 'usuario', etiqueta: 'Usuarios' },
            { valor: 'producto', etiqueta: 'Productos' },
            { valor: 'comunidad', etiqueta: 'Comunidades' },
          ]}
          marcador="Todos los tipos"
          className="w-48"
        />
      </div>

      {/* Contenido */}
      {cargando && elementos.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, indice) => (
            <div key={indice} className="tarjeta space-y-2 p-4">
              <Esqueleto className="h-3.5 w-1/4" />
              <Esqueleto className="h-3.5 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar los reportes" detalle={error} alReintentar={() => cargar(1)} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio
          titulo="Sin reportes"
          descripcion="No hay reportes que coincidan con el filtro. La comunidad esta tranquila."
          icono={Flag}
        />
      )}

      {!cargando && !error && elementos.length > 0 && (
        <ul className="space-y-3">
          {elementos.map((reporte) => (
            <li key={reporte._id} className="tarjeta p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Insignia className={colorEstado(reporte.estado)}>{etiquetaEstado(reporte.estado)}</Insignia>
                    <span className="insignia bg-emi-100 text-emi-700 dark:bg-emi-800 dark:text-emi-100">
                      {etiquetaTipo(reporte.tipo)}
                    </span>
                    <span className="text-xs text-emi-400">
                      {MOTIVOS_REPORTE.find((motivo) => motivo.valor === reporte.motivo)?.etiqueta || reporte.motivo}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Avatar usuario={reporte.reportante} tamanos="mini" />
                    <span className="text-xs text-emi-500">
                      Reportado por {nombreCompleto(reporte.reportante)} · {tiempoRelativo(reporte.fechaCreacion)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm text-emi-800 dark:text-emi-100">
                    {reporte.resumen ? (
                      <>
                        <span className="font-medium">{reporte.resumen.titulo}</span>
                        {reporte.resumen.texto && <> — {recortar(reporte.resumen.texto, 160)}</>}
                        {reporte.resumen.eliminado && (
                          <span className="ml-1 text-xs text-red-500">(contenido ya eliminado)</span>
                        )}
                      </>
                    ) : (
                      <span className="texto-secundario">El contenido reportado ya no existe.</span>
                    )}
                  </p>

                  {reporte.descripcion && (
                    <p className="mt-1 text-xs text-emi-500">Detalle: {reporte.descripcion}</p>
                  )}

                  {reporte.notaRevision && (
                    <p className="mt-1 text-xs text-emi-400">
                      Nota de revision: {reporte.notaRevision}
                      {reporte.accionTomada && ` · accion: ${reporte.accionTomada}`}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {reporte.resumen?.autor && reporte.estado !== 'resuelto' && reporte.estado !== 'rechazado' && (
                    <Link
                      to={`/perfil/${reporte.resumen.autor}`}
                      className="text-xs font-medium text-emi-600 hover:underline dark:text-emi-300"
                    >
                      Ver autor
                    </Link>
                  )}

                  {reporte.estado === 'pendiente' || reporte.estado === 'en_revision' ? (
                    <Boton
                      variante="primario"
                      tamano="pequeno"
                      icono={Check}
                      onClick={() => setReporteActivo(reporte)}
                    >
                      Resolver
                    </Boton>
                  ) : (
                    <span className="text-xs text-emi-400">
                      {etiquetaEstado(reporte.estado)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hayMas && (
        <div className="flex justify-center">
          <Boton variante="contorno" cargando={cargando} onClick={() => cargar(pagina + 1)}>
            Cargar mas reportes
          </Boton>
        </div>
      )}

      <ModalResolverReporte
        reporte={reporteActivo}
        alCerrar={() => setReporteActivo(null)}
        alResolver={() => {
          setReporteActivo(null);
          cargar(1);
        }}
      />
    </div>
  );
}

/** Modal de resolucion de un reporte con nota y accion aplicada. */
function ModalResolverReporte({ reporte, alCerrar, alResolver }) {
  const toast = useToast();
  const [nota, setNota] = useState('');
  const [accion, setAccion] = useState('ninguna');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (reporte) {
      setNota('');
      setAccion('ninguna');
    }
  }, [reporte]);

  const resolver = async (estado) => {
    if (!reporte) return;
    if (estado === 'resuelto' && accion !== 'ninguna' && nota.trim().length < 5) {
      toast.error('Describe la accion tomada en la nota de revision.');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await servicioReportes.resolver(reporte._id, {
        estado,
        notaRevision: nota.trim(),
        accion,
      });
      toast.exito(resultado?.mensaje || 'Reporte actualizado.');
      alResolver();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo resolver el reporte.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={Boolean(reporte)}
      alCerrar={alCerrar}
      titulo="Resolver reporte"
      descripcion={
        reporte
          ? `${reporte.resumen?.titulo || reporte.tipo} · motivo: ${
              MOTIVOS_REPORTE.find((motivo) => motivo.valor === reporte.motivo)?.etiqueta || reporte.motivo
            }`
          : ''
      }
      tamanos="normal"
      bloquearCierre={guardando}
      pie={
        <div className="flex flex-wrap justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={guardando}>
            Cancelar
          </Boton>
          <Boton
            variante="contorno"
            icono={X}
            onClick={() => resolver('rechazado')}
            cargando={guardando}
          >
            Rechazar reporte
          </Boton>
          <Boton
            variante={accion === 'bloquear_usuario' ? 'peligro' : 'primario'}
            icono={accion === 'bloquear_usuario' ? Ban : Check}
            onClick={() => resolver('resuelto')}
            cargando={guardando}
          >
            Marcar resuelto
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <AreaTexto
          etiqueta="Nota de revision"
          valor={nota}
          alCambiar={setNota}
          filas={3}
          maxLength={500}
          marcador="Que se observo y que decision se tomo..."
        />

        <Selector
          etiqueta="Accion aplicada"
          valor={accion}
          alCambiar={setAccion}
          opciones={[
            { valor: 'ninguna', etiqueta: 'Ninguna (solo registrar)' },
            { valor: 'eliminar_contenido', etiqueta: 'Eliminar el contenido reportado' },
            { valor: 'bloquear_usuario', etiqueta: 'Bloquear al autor' },
          ]}
          ayuda="La accion se aplica automaticamente al marcar el reporte como resuelto."
        />
      </div>
    </Modal>
  );
}
