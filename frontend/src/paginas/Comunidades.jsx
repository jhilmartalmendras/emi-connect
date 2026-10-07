import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersRound, Plus, Search } from 'lucide-react';
import { TarjetaComunidad } from '../componentes/contenido/TarjetaComunidad';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { Modal } from '../componentes/comunes/Modal';
import { Campo, AreaTexto, Selector, Casilla } from '../componentes/comunes/EntradaTexto';
import { useToast } from '../contexto/ContextoToast';
import { servicioComunidades } from '../servicios/servicioComunidades';
import { CATEGORIAS_PUBLICACION } from '../constantes/catalogos';

/** Exploracion de comunidades: listado, filtros, creacion y unirse. */
export default function Comunidades() {
  const toast = useToast();
  const navegar = useNavigate();

  const [filtro, setFiltro] = useState('todas');
  const [categoria, setCategoria] = useState('');
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [abiertoCrear, setAbiertoCrear] = useState(false);
  const [uniendose, setUniendose] = useState({});

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await servicioComunidades.listar({
        pagina: 1,
        limite: 24,
        categoria: categoria || undefined,
        filtro: filtro === 'mis' ? 'misComunidades' : undefined,
      });
      setElementos(datos.comunidades || []);
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudieron cargar las comunidades.');
      setElementos([]);
    } finally {
      setCargando(false);
    }
  }, [filtro, categoria]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Se une a una comunidad (o abre la comunidad si ya es miembro). */
  const unirse = async (comunidad) => {
    if (comunidad.soyMiembro) {
      navegar(`/comunidades/${comunidad._id}`);
      return;
    }

    setUniendose((actuales) => ({ ...actuales, [comunidad._id]: true }));
    try {
      const resultado = await servicioComunidades.unirse(comunidad._id);
      toast.exito(resultado?.mensaje || 'Te uniste a la comunidad.');
      cargar();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo unir a la comunidad.');
    } finally {
      setUniendose((actuales) => ({ ...actuales, [comunidad._id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Comunidades</h1>
          <p className="texto-secundario">Grupos de estudio, deportes, carreras y proyectos de la EMI.</p>
        </div>
        <Boton variante="primario" icono={Plus} onClick={() => setAbiertoCrear(true)}>
          Crear comunidad
        </Boton>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-emi-100 bg-white p-1 dark:border-emi-800 dark:bg-emi-900">
          {[
            { valor: 'todas', etiqueta: 'Todas' },
            { valor: 'mis', etiqueta: 'Mis comunidades' },
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

        <Selector
          valor={categoria}
          alCambiar={setCategoria}
          opciones={CATEGORIAS_PUBLICACION.map((item) => ({ valor: item.valor, etiqueta: item.etiqueta }))}
          marcador="Todas las categorias"
          className="w-52"
        />
      </div>

      {/* Contenido */}
      {cargando && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, indice) => (
            <div key={indice} className="tarjeta overflow-hidden">
              <Esqueleto className="h-24 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Esqueleto className="h-4 w-3/4" />
                <Esqueleto className="h-3 w-full" />
                <Esqueleto className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar las comunidades" detalle={error} alReintentar={cargar} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio
          titulo={filtro === 'mis' ? 'No perteneces a ninguna comunidad' : 'No hay comunidades todavia'}
          descripcion={
            filtro === 'mis'
              ? 'Explora las comunidades disponibles y unete a la que mas te interese.'
              : 'Se la primera en crear una comunidad para tu carrera o proyecto.'
          }
          icono={UsersRound}
          accion={() => (filtro === 'mis' ? setFiltro('todas') : setAbiertoCrear(true))}
          etiquetaAccion={filtro === 'mis' ? 'Explorar comunidades' : 'Crear comunidad'}
        />
      )}

      {!cargando && !error && elementos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {elementos.map((comunidad) => (
            <TarjetaComunidad
              key={comunidad._id}
              comunidad={comunidad}
              alUnirse={() => unirse(comunidad)}
              uniendose={uniendose[comunidad._id]}
            />
          ))}
        </div>
      )}

      <ModalCrearComunidad
        abierto={abiertoCrear}
        alCerrar={() => setAbiertoCrear(false)}
        alCrear={(comunidad) => {
          setAbiertoCrear(false);
          navegar(`/comunidades/${comunidad._id}`);
        }}
      />
    </div>
  );
}

/** Formulario de creacion de comunidades. */
function ModalCrearComunidad({ abierto, alCerrar, alCrear }) {
  const toast = useToast();
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'general',
    reglas: '',
    esPrivada: false,
  });
  const [imagen, setImagen] = useState(null);
  const [portada, setPortada] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave) => (valor) => setFormulario((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async () => {
    if (formulario.nombre.trim().length < 4) {
      toast.error('El nombre debe tener al menos 4 caracteres.');
      return;
    }
    if (formulario.descripcion.trim().length < 10) {
      toast.error('Describe la comunidad en al menos 10 caracteres.');
      return;
    }

    setGuardando(true);
    try {
      const comunidad = await servicioComunidades.crear({
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
        categoria: formulario.categoria,
        reglas: formulario.reglas
          .split('\n')
          .map((regla) => regla.trim())
          .filter(Boolean),
        esPrivada: formulario.esPrivada,
        imagen,
        portada,
      });
      toast.exito('Comunidad creada correctamente.');
      setFormulario({ nombre: '', descripcion: '', categoria: 'general', reglas: '', esPrivada: false });
      setImagen(null);
      setPortada(null);
      alCrear(comunidad.comunidad);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo crear la comunidad.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Crear comunidad"
      descripcion="Agrupa a estudiantes de tu carrera, semestre o proyecto."
      tamanos="normal"
      bloquearCierre={guardando}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={guardando}>
            Cancelar
          </Boton>
          <Boton variante="primario" icono={Plus} onClick={guardar} cargando={guardando}>
            Crear comunidad
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo
          etiqueta="Nombre"
          valor={formulario.nombre}
          alCambiar={cambiar('nombre')}
          marcador="Ej. Club de Robotica EMI"
          requerido
          maxLength={120}
        />

        <AreaTexto
          etiqueta="Descripcion"
          valor={formulario.descripcion}
          alCambiar={cambiar('descripcion')}
          filas={3}
          maxLength={800}
          marcador="¿De que trata la comunidad y a quien esta dirigida?"
          requerido
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Selector
            etiqueta="Categoria"
            valor={formulario.categoria}
            alCambiar={cambiar('categoria')}
            opciones={CATEGORIAS_PUBLICACION.map((item) => ({ valor: item.valor, etiqueta: item.etiqueta }))}
          />
          <Casilla
            etiqueta="Comunidad privada"
            valor={formulario.esPrivada}
            alCambiar={cambiar('esPrivada')}
            ayuda="Las privadas aprueban cada solicitud de ingreso."
          />
        </div>

        <AreaTexto
          etiqueta="Reglas (opcional)"
          valor={formulario.reglas}
          alCambiar={cambiar('reglas')}
          filas={3}
          maxLength={1200}
          marcador={"Una regla por linea\nEj. Respeto entre miembros"}
          ayuda="Cada linea se convierte en una regla visible de la comunidad."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col gap-1 text-sm font-medium text-emi-800 dark:text-emi-100">
            Imagen de la comunidad (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={(evento) => setImagen(evento.target.files?.[0] || null)}
              className="block w-full text-xs text-emi-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emi-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emi-700 hover:file:bg-emi-200"
            />
          </label>

          <label className="flex cursor-pointer flex-col gap-1 text-sm font-medium text-emi-800 dark:text-emi-100">
            Portada (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={(evento) => setPortada(evento.target.files?.[0] || null)}
              className="block w-full text-xs text-emi-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emi-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emi-700 hover:file:bg-emi-200"
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}
