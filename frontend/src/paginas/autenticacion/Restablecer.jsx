import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { LayoutAutenticacion } from './LayoutAutenticacion';
import { Boton } from '../../componentes/comunes/Boton';
import { Campo } from '../../componentes/comunes/EntradaTexto';
import { useToast } from '../../contexto/ContextoToast';
import { servicioAutenticacion } from '../../servicios/servicioAutenticacion';

/**
 * Restablecimiento de contrasena (paso 3): define la nueva contrasena
 * usando el token temporal obtenido en la verificacion del codigo.
 */
export default function Restablecer() {
  const toast = useToast();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const { correo = '', tokenTemporal = '' } = ubicacion.state || {};

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Sin token no hay forma segura de restablecer: se vuelve al paso 1.
  if (!tokenTemporal) {
    return <Navigate to="/recuperar" replace />;
  }

  const enviar = async (evento) => {
    evento.preventDefault();
    const nuevos = {};

    if (nuevaContrasena.length < 8) nuevos.nuevaContrasena = 'La contrasena debe tener al menos 8 caracteres.';
    else if (!/[A-Za-z]/.test(nuevaContrasena) || !/[0-9]/.test(nuevaContrasena)) {
      nuevos.nuevaContrasena = 'Debe incluir al menos una letra y un numero.';
    }
    if (confirmar !== nuevaContrasena) nuevos.confirmar = 'Las contrasenas no coinciden.';

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      const resultado = await servicioAutenticacion.restablecerContrasena({
        tokenTemporal,
        correo,
        nuevaContrasena,
      });
      toast.exito(resultado?.mensaje || 'Contrasena actualizada correctamente.');
      navegar('/login', { replace: true });
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo restablecer la contrasena.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <LayoutAutenticacion
      titulo="Nueva contrasena"
      descripcion="Define una contrasena segura para tu cuenta institucional."
      pie={
        <>
          ¿Ya la recordaste?{' '}
          <Link to="/login" className="enlace font-medium">
            Volver al inicio de sesion
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo
          etiqueta="Nueva contrasena"
          tipo="password"
          valor={nuevaContrasena}
          alCambiar={setNuevaContrasena}
          error={errores.nuevaContrasena}
          ayuda="Minimo 8 caracteres, con letra y numero."
          requerido
          autoComplete="new-password"
        />
        <Campo
          etiqueta="Confirmar nueva contrasena"
          tipo="password"
          valor={confirmar}
          alCambiar={setConfirmar}
          error={errores.confirmar}
          requerido
          autoComplete="new-password"
        />
        <Boton type="submit" variante="primario" tamano="grande" icono={Save} cargando={guardando} className="w-full">
          Guardar contrasena
        </Boton>
      </form>
    </LayoutAutenticacion>
  );
}
