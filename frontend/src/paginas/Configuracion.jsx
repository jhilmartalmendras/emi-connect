import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Lock, Shield, Bell, Ban, AlertTriangle, Save, LogOut } from 'lucide-react';
import { Boton } from '../componentes/comunes/Boton';
import { Campo, Selector, Casilla } from '../componentes/comunes/EntradaTexto';
import { ModalConfirmacion } from '../componentes/comunes/Modal';
import { Avatar } from '../componentes/comunes/Avatar';
import { useToast } from '../contexto/ContextoToast';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useTema } from '../contexto/ContextoTema';
import { servicioUsuarios } from '../servicios/servicioUsuarios';
import { servicioAutenticacion } from '../servicios/servicioAutenticacion';
import { NIVELES_PRIVACIDAD } from '../constantes/catalogos';
import { nombreCompleto } from '../utilidades/textos';

/** Configuracion de la cuenta: apariencia, privacidad, seguridad y bloqueos. */
export default function Configuracion() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="titulo-seccion">Configuracion</h1>
        <p className="texto-secundario">Administra tu cuenta, tu privacidad y la apariencia de EMI Connect.</p>
      </header>

      <SeccionApariencia />
      <SeccionPrivacidad />
      <SeccionSeguridad />
      <SeccionCorreo />
      <SeccionBloqueos />
      <SeccionCuenta />
    </div>
  );
}

/** Tarjeta base de cada seccion. */
function Seccion({ icono: Icono, titulo, descripcion, children }) {
  return (
    <section className="tarjeta p-5" aria-labelledby={`seccion-${titulo}`}>
      <header className="mb-4 flex items-start gap-3">
        <span className="rounded-lg bg-emi-50 p-2 dark:bg-emi-800">
          <Icono className="h-5 w-5 text-emi-600 dark:text-emi-200" aria-hidden="true" />
        </span>
        <div>
          <h2 id={`seccion-${titulo}`} className="text-sm font-semibold text-emi-900 dark:text-emi-50">
            {titulo}
          </h2>
          <p className="texto-secundario">{descripcion}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

/** Tema de la interfaz. */
function SeccionApariencia() {
  const { tema, cambiarTema } = useTema();

  return (
    <Seccion icono={Palette} titulo="Apariencia" descripcion="Elige como se ve la plataforma en tu dispositivo.">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { valor: 'claro', etiqueta: 'Claro' },
          { valor: 'oscuro', etiqueta: 'Oscuro' },
          { valor: 'sistema', etiqueta: 'Seguir el sistema' },
        ].map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => cambiarTema(opcion.valor)}
            aria-pressed={tema === opcion.valor}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              tema === opcion.valor
                ? 'border-emi-600 bg-emi-50 text-emi-800 ring-2 ring-emi-200 dark:border-emi-400 dark:bg-emi-800 dark:text-emi-50'
                : 'border-emi-200 text-emi-600 hover:bg-emi-50 dark:border-emi-700 dark:text-emi-300 dark:hover:bg-emi-800'
            }`}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>
    </Seccion>
  );
}

/** Privacidad del perfil y de las interacciones. */
function SeccionPrivacidad() {
  const toast = useToast();
  const [privacidad, setPrivacidad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    servicioUsuarios
      .obtenerPrivacidad()
      .then((datos) => setPrivacidad(datos.privacidad))
      .catch(() => toast.error('No se pudo cargar la configuracion de privacidad.'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiar = (clave, valor) => setPrivacidad((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async () => {
    setGuardando(true);
    try {
      const resultado = await servicioUsuarios.actualizarPrivacidad(privacidad);
      setPrivacidad(resultado.privacidad);
      toast.exito('Privacidad actualizada correctamente.');
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo actualizar la privacidad.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Seccion icono={Shield} titulo="Privacidad" descripcion="Controla quien puede ver tu contenido y contactarte.">
        <p className="texto-secundario">Cargando configuracion...</p>
      </Seccion>
    );
  }

  if (!privacidad) return null;

  const niveles = NIVELES_PRIVACIDAD.map((item) => ({ valor: item.valor, etiqueta: item.etiqueta }));

  return (
    <Seccion icono={Shield} titulo="Privacidad" descripcion="Controla quien puede ver tu contenido y contactarte.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector
          etiqueta="Perfil visible para"
          valor={privacidad.visibilidadPerfil}
          alCambiar={(valor) => cambiar('visibilidadPerfil', valor)}
          opciones={niveles}
        />
        <Selector
          etiqueta="Publicaciones visibles para"
          valor={privacidad.visibilidadPublicaciones}
          alCambiar={(valor) => cambiar('visibilidadPublicaciones', valor)}
          opciones={niveles}
        />
        <Selector
          etiqueta="Quien puede enviarte solicitudes"
          valor={privacidad.quienPuedeEnviarSolicitudes}
          alCambiar={(valor) => cambiar('quienPuedeEnviarSolicitudes', valor)}
          opciones={niveles}
        />
        <Selector
          etiqueta="Quien puede enviarte mensajes"
          valor={privacidad.quienPuedeEnviarMensajes}
          alCambiar={(valor) => cambiar('quienPuedeEnviarMensajes', valor)}
          opciones={niveles}
        />
        <Selector
          etiqueta="Quien puede ver tus contactos"
          valor={privacidad.quienPuedeVerAmigos}
          alCambiar={(valor) => cambiar('quienPuedeVerAmigos', valor)}
          opciones={niveles}
        />
        <Selector
          etiqueta="Quien puede ver tus comunidades"
          valor={privacidad.quienPuedeVerComunidades}
          alCambiar={(valor) => cambiar('quienPuedeVerComunidades', valor)}
          opciones={niveles}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Casilla
          etiqueta="Mostrar mi correo en el perfil"
          valor={privacidad.mostrarCorreo}
          alCambiar={(valor) => cambiar('mostrarCorreo', valor)}
        />
        <Casilla
          etiqueta="Mostrar mi semestre"
          valor={privacidad.mostrarSemestre}
          alCambiar={(valor) => cambiar('mostrarSemestre', valor)}
        />
        <Casilla
          etiqueta="Permitir que me etiqueten"
          valor={privacidad.permitirEtiquetas}
          alCambiar={(valor) => cambiar('permitirEtiquetas', valor)}
        />
        <Casilla
          etiqueta="Aparecer en las busquedas"
          valor={privacidad.aparecerEnBusquedas}
          alCambiar={(valor) => cambiar('aparecerEnBusquedas', valor)}
        />
        <Casilla
          etiqueta="Recibir notificaciones"
          valor={privacidad.recibirNotificaciones}
          alCambiar={(valor) => cambiar('recibirNotificaciones', valor)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Boton variante="primario" icono={Save} onClick={guardar} cargando={guardando}>
          Guardar privacidad
        </Boton>
      </div>
    </Seccion>
  );
}

/** Cambio de contrasena. */
function SeccionSeguridad() {
  const toast = useToast();
  const [formulario, setFormulario] = useState({
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: '',
  });
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave) => (valor) => setFormulario((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async () => {
    if (!formulario.contrasenaActual || !formulario.nuevaContrasena) {
      toast.error('Completa todos los campos de contrasena.');
      return;
    }
    if (formulario.nuevaContrasena.length < 8 || !/[A-Za-z]/.test(formulario.nuevaContrasena) || !/[0-9]/.test(formulario.nuevaContrasena)) {
      toast.error('La nueva contrasena debe tener al menos 8 caracteres, con letra y numero.');
      return;
    }
    if (formulario.nuevaContrasena !== formulario.confirmarContrasena) {
      toast.error('Las contrasenas no coinciden.');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await servicioAutenticacion.cambiarContrasena({
        contrasenaActual: formulario.contrasenaActual,
        nuevaContrasena: formulario.nuevaContrasena,
        confirmarContrasena: formulario.confirmarContrasena,
      });
      toast.exito(resultado?.mensaje || 'Contrasena actualizada correctamente.');
      setFormulario({ contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' });
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo cambiar la contrasena.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Seccion icono={Lock} titulo="Seguridad" descripcion="Cambia tu contrasena con regularidad para proteger tu cuenta.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          etiqueta="Contrasena actual"
          tipo="password"
          valor={formulario.contrasenaActual}
          alCambiar={cambiar('contrasenaActual')}
          autoComplete="current-password"
        />
        <Campo
          etiqueta="Nueva contrasena"
          tipo="password"
          valor={formulario.nuevaContrasena}
          alCambiar={cambiar('nuevaContrasena')}
          ayuda="Minimo 8 caracteres, letra y numero."
          autoComplete="new-password"
        />
        <Campo
          etiqueta="Confirmar nueva"
          tipo="password"
          valor={formulario.confirmarContrasena}
          alCambiar={cambiar('confirmarContrasena')}
          autoComplete="new-password"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Boton variante="primario" icono={Save} onClick={guardar} cargando={guardando}>
          Cambiar contrasena
        </Boton>
      </div>
    </Seccion>
  );
}

/** Preferencias de notificaciones por correo. */
function SeccionCorreo() {
  const toast = useToast();
  const { usuario, actualizarUsuario } = useAutenticacion();
  const [acepta, setAcepta] = useState(Boolean(usuario?.aceptaNotificacionesCorreo));
  const [guardando, setGuardando] = useState(false);

  const cambiar = async (valor) => {
    setAcepta(valor);
    setGuardando(true);
    try {
      const resultado = await servicioUsuarios.actualizarMiPerfil({ aceptaNotificacionesCorreo: valor });
      actualizarUsuario(resultado.usuario);
      toast.exito('Preferencia de correo actualizada.');
    } catch (error) {
      setAcepta(!valor);
      toast.error(error.mensaje || 'No se pudo actualizar la preferencia.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Seccion
      icono={Bell}
      titulo="Notificaciones por correo"
      descripcion="Recibe avisos de mensajes importantes en tu correo institucional."
    >
      <Casilla
        etiqueta="Acepto recibir notificaciones por correo"
        valor={acepta}
        alCambiar={cambiar}
        deshabilitado={guardando}
        ayuda="Incluye solicitudes de amistad, mensajes directos y avisos de la plataforma."
      />
    </Seccion>
  );
}

/** Usuarios bloqueados. */
function SeccionBloqueos() {
  const toast = useToast();
  const [bloqueados, setBloqueados] = useState(null);

  useEffect(() => {
    servicioUsuarios
      .listarBloqueados()
      .then((datos) => setBloqueados(datos.bloqueados || []))
      .catch(() => setBloqueados([]));
  }, []);

  const desbloquear = async (usuarioBloqueado) => {
    try {
      await servicioUsuarios.desbloquearUsuario(usuarioBloqueado._id);
      setBloqueados((actuales) => actuales.filter((item) => item._id !== usuarioBloqueado._id));
      toast.exito('Usuario desbloqueado.');
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo desbloquear al usuario.');
    }
  };

  return (
    <Seccion icono={Ban} titulo="Usuarios bloqueados" descripcion="Las personas bloqueadas no pueden ver tu perfil ni contactarte.">
      {bloqueados === null ? (
        <p className="texto-secundario">Cargando lista...</p>
      ) : bloqueados.length === 0 ? (
        <p className="texto-secundario">No tienes usuarios bloqueados.</p>
      ) : (
        <ul className="space-y-2">
          {bloqueados.map((usuarioBloqueado) => (
            <li key={usuarioBloqueado._id} className="flex items-center gap-3 rounded-xl border border-emi-100 px-3 py-2 dark:border-emi-800">
              <Avatar usuario={usuarioBloqueado} tamanos="pequeno" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-emi-900 dark:text-emi-50">
                  {nombreCompleto(usuarioBloqueado)}
                </span>
                <span className="block truncate text-xs text-emi-500">{usuarioBloqueado.correo}</span>
              </span>
              <Boton variante="contorno" tamano="pequeno" onClick={() => desbloquear(usuarioBloqueado)}>
                Desbloquear
              </Boton>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}

/** Zona de peligro: desactivacion de la cuenta. */
function SeccionCuenta() {
  const toast = useToast();
  const navegar = useNavigate();
  const { cerrarSesion } = useAutenticacion();
  const [confirmar, setConfirmar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const desactivar = async () => {
    setEliminando(true);
    try {
      await servicioUsuarios.desactivarCuenta();
      toast.exito('Tu cuenta fue desactivada. Esperamos verte pronto.');
      await cerrarSesion();
      navegar('/login', { replace: true });
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo desactivar la cuenta.');
      setEliminando(false);
      setConfirmar(false);
    }
  };

  const cerrar = async () => {
    await cerrarSesion();
    navegar('/login');
  };

  return (
    <Seccion
      icono={AlertTriangle}
      titulo="Cuenta"
      descripcion="Cierra tu sesion o desactiva tu cuenta de EMI Connect."
    >
      <div className="flex flex-wrap gap-3">
        <Boton variante="contorno" icono={LogOut} onClick={cerrar}>
          Cerrar sesion
        </Boton>
        <Boton variante="peligro" icono={AlertTriangle} onClick={() => setConfirmar(true)}>
          Desactivar mi cuenta
        </Boton>
      </div>

      <p className="mt-3 text-xs text-emi-400">
        Al desactivar tu cuenta dejaras de aparecer en busquedas y tus publicaciones dejaran de ser visibles.
      </p>

      <ModalConfirmacion
        abierto={confirmar}
        alCerrar={() => setConfirmar(false)}
        alConfirmar={desactivar}
        titulo="Desactivar cuenta"
        mensaje="Tu cuenta se marcara como desactivada y perderas el acceso a EMI Connect. Esta accion no se puede deshacer."
        textoConfirmar="Desactivar cuenta"
        cargando={eliminando}
      />
    </Seccion>
  );
}
