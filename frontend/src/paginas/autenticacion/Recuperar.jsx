import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound } from 'lucide-react';
import { LayoutAutenticacion } from './LayoutAutenticacion';
import { Boton } from '../../componentes/comunes/Boton';
import { Campo } from '../../componentes/comunes/EntradaTexto';
import { useToast } from '../../contexto/ContextoToast';
import { servicioAutenticacion } from '../../servicios/servicioAutenticacion';

/**
 * Recuperacion de contrasena (paso 1 y 2):
 * solicita el codigo al correo institucional y lo verifica.
 */
export default function Recuperar() {
  const toast = useToast();
  const navegar = useNavigate();

  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const solicitar = async (evento) => {
    evento.preventDefault();
    const correoLimpio = correo.trim().toLowerCase();
    if (!correoLimpio) {
      setErrores({ correo: 'Ingresa tu correo institucional.' });
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      const resultado = await servicioAutenticacion.solicitarRecuperacion(correoLimpio);
      toast.informativo(resultado?.mensaje || 'Revisa tu correo institucional.');
      setPaso(2);
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo solicitar el codigo.');
    } finally {
      setEnviando(false);
    }
  };

  const verificar = async (evento) => {
    evento.preventDefault();
    if (codigo.trim().length !== 6) {
      setErrores({ codigo: 'El codigo tiene 6 digitos.' });
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      const resultado = await servicioAutenticacion.verificarRecuperacion(correo.trim().toLowerCase(), codigo.trim());
      navegar('/restablecer', {
        state: { correo: correo.trim().toLowerCase(), tokenTemporal: resultado.tokenTemporal },
      });
    } catch (error) {
      toast.error(error.mensaje || 'El codigo no es valido.');
      setCodigo('');
    } finally {
      setEnviando(false);
    }
  };

  if (paso === 1) {
    return (
      <LayoutAutenticacion
        titulo="Recuperar contrasena"
        descripcion="Te enviaremos un codigo a tu correo institucional."
        pie={
          <>
            ¿Recordaste tu contrasena?{' '}
            <Link to="/login" className="enlace font-medium">
              Volver al inicio de sesion
            </Link>
          </>
        }
      >
        <form onSubmit={solicitar} noValidate className="space-y-4">
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
          <Boton type="submit" variante="primario" tamano="grande" icono={Mail} cargando={enviando} className="w-full">
            Enviar codigo
          </Boton>
        </form>
      </LayoutAutenticacion>
    );
  }

  return (
    <LayoutAutenticacion
      titulo="Ingresa tu codigo"
      descripcion={`Enviamos un codigo de 6 digitos a ${correo.trim()}.`}
      pie={
        <>
          ¿No recibiste el correo?{' '}
          <button
            type="button"
            onClick={() => setPaso(1)}
            className="enlace font-medium"
          >
            Cambiar de correo
          </button>
        </>
      }
    >
      <form onSubmit={verificar} noValidate className="space-y-4">
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
        <Boton type="submit" variante="primario" tamano="grande" icono={KeyRound} cargando={enviando} className="w-full">
          Verificar codigo
        </Boton>
      </form>
    </LayoutAutenticacion>
  );
}
