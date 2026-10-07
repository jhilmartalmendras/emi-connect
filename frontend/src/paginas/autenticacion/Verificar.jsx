import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { LayoutAutenticacion } from './LayoutAutenticacion';
import { Boton } from '../../componentes/comunes/Boton';
import { Campo } from '../../componentes/comunes/EntradaTexto';
import { useToast } from '../../contexto/ContextoToast';
import { servicioAutenticacion } from '../../servicios/servicioAutenticacion';

/**
 * Verificacion de cuenta: codigo de 6 digitos enviado al correo institucional.
 * Si llega sin correo (acceso directo), primero se pide el correo.
 */
export default function Verificar() {
  const toast = useToast();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [correo, setCorreo] = useState(ubicacion.state?.correo || '');
  const [codigo, setCodigo] = useState('');
  const [errores, setErrores] = useState({});
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const codigoRef = useRef(null);

  const correoPendiente = correo.trim().toLowerCase();

  const verificar = async (evento) => {
    evento.preventDefault();
    const nuevos = {};

    if (!correoPendiente) nuevos.correo = 'Ingresa el correo de tu cuenta.';
    if (codigo.trim().length !== 6) nuevos.codigo = 'El codigo tiene 6 digitos.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setVerificando(true);
    try {
      await servicioAutenticacion.verificar(correoPendiente, codigo.trim());
      toast.exito('Cuenta verificada. Ya puedes iniciar sesion.');
      navegar('/login', { replace: true });
    } catch (error) {
      toast.error(error.mensaje || 'El codigo no es valido.');
      setCodigo('');
      if (codigoRef.current) codigoRef.current.focus();
    } finally {
      setVerificando(false);
    }
  };

  const reenviar = async () => {
    if (!correoPendiente) {
      setErrores({ correo: 'Ingresa el correo de tu cuenta para reenviar el codigo.' });
      return;
    }

    setReenviando(true);
    try {
      const resultado = await servicioAutenticacion.reenviarCodigo(correoPendiente);
      toast.exito(resultado?.mensaje || 'Enviamos un nuevo codigo a tu correo institucional.');
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo reenviar el codigo.');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <LayoutAutenticacion
      titulo="Verifica tu cuenta"
      descripcion="Enviamos un codigo de 6 digitos a tu correo institucional."
      pie={
        <>
          ¿Necesitas otra cuenta?{' '}
          <Link to="/registro" className="enlace font-medium">
            Registrate
          </Link>
        </>
      }
    >
      <form onSubmit={verificar} noValidate className="space-y-4">
        <Campo
          etiqueta="Correo institucional"
          tipo="email"
          valor={correo}
          alCambiar={setCorreo}
          error={errores.correo}
          marcador="nombre@est.emi.edu.bo"
          requerido
          autoComplete="username"
        />

        <Campo
          etiqueta="Codigo de verificacion"
          valor={codigo}
          alCambiar={(valor) => setCodigo(valor.replace(/\D/g, '').slice(0, 6))}
          error={errores.codigo}
          marcador="000000"
          ayuda="Si el modo de desarrollo esta activo, el codigo aparece en backend/servidor.log."
          requerido
          maxLength={6}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Boton type="submit" variante="primario" tamano="grande" icono={ShieldCheck} cargando={verificando} className="flex-1">
            Verificar cuenta
          </Boton>
          <Boton
            type="button"
            variante="contorno"
            tamano="grande"
            icono={RefreshCw}
            onClick={reenviar}
            cargando={reenviando}
          >
            Reenviar codigo
          </Boton>
        </div>
      </form>
    </LayoutAutenticacion>
  );
}
