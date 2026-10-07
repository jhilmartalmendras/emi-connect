import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { LayoutAutenticacion } from './LayoutAutenticacion';
import { Boton } from '../../componentes/comunes/Boton';
import { Campo } from '../../componentes/comunes/EntradaTexto';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useToast } from '../../contexto/ContextoToast';

/** Pantalla de inicio de sesion con correo institucional y contrasena. */
export default function Login() {
  const { iniciarSesion, sesionExpirada } = useAutenticacion();
  const toast = useToast();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [errores, setErrores] = useState({});
  const [entrando, setEntrando] = useState(false);

  const validar = () => {
    const nuevos = {};
    if (!correo.trim()) nuevos.correo = 'Ingresa tu correo institucional.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) nuevos.correo = 'El correo no es valido.';
    if (!contrasena) nuevos.contrasena = 'Ingresa tu contrasena.';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!validar()) return;

    setEntrando(true);
    try {
      await iniciarSesion(correo.trim().toLowerCase(), contrasena);
      toast.exito('Bienvenido a EMI Connect.');
      const destino = ubicacion.state?.desde || '/inicio';
      navegar(destino, { replace: true });
    } catch (error) {
      if (error.estado === 403) {
        // Cuenta sin verificar: se envia a la pantalla de verificacion.
        navegar('/verificar', { state: { correo: correo.trim().toLowerCase() } });
      }
      toast.error(error.mensaje || 'No se pudo iniciar sesion.');
    } finally {
      setEntrando(false);
    }
  };

  return (
    <LayoutAutenticacion
      titulo="Iniciar sesion"
      descripcion="Accede con tu correo institucional de la EMI."
      pie={
        <>
          ¿Todavia no tienes cuenta?{' '}
          <Link to="/registro" className="enlace font-medium">
            Registrate aqui
          </Link>
        </>
      }
    >
      {sesionExpirada && (
        <div
          className="mb-4 rounded-lg border border-dorado-300 bg-dorado-50 px-4 py-3 text-sm text-dorado-800 dark:border-dorado-700 dark:bg-dorado-900/40 dark:text-dorado-100"
          role="alert"
        >
          Tu sesion expiro o fue cerrada. Inicia sesion nuevamente para continuar.
        </div>
      )}

      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo
          etiqueta="Correo institucional"
          tipo="email"
          valor={correo}
          alCambiar={setCorreo}
          marcador="nombre@est.emi.edu.bo"
          error={errores.correo}
          requerido
          autoComplete="username"
        />

        <div>
          <Campo
            etiqueta="Contrasena"
            tipo={verContrasena ? 'text' : 'password'}
            valor={contrasena}
            alCambiar={setContrasena}
            error={errores.contrasena}
            requerido
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setVerContrasena((valor) => !valor)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emi-500 transition hover:text-emi-700 dark:text-emi-300"
          >
            {verContrasena ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {verContrasena ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <Link to="/recuperar" className="text-sm enlace">
            ¿Olvidaste tu contrasena?
          </Link>
        </div>

        <Boton type="submit" variante="primario" tamano="grande" icono={LogIn} cargando={entrando} className="w-full">
          Entrar
        </Boton>
      </form>
    </LayoutAutenticacion>
  );
}
