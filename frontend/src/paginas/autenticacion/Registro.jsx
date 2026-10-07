import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { LayoutAutenticacion } from './LayoutAutenticacion';
import { Boton } from '../../componentes/comunes/Boton';
import { Campo, Selector } from '../../componentes/comunes/EntradaTexto';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useToast } from '../../contexto/ContextoToast';
import { servicioAutenticacion } from '../../servicios/servicioAutenticacion';

/** Registro de cuenta nueva exclusiva para correos @est.emi.edu.bo. */
export default function Registro() {
  const { registrar } = useAutenticacion();
  const toast = useToast();
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    carrera: '',
    semestre: '',
    unidadAcademica: '',
  });
  const [catalogos, setCatalogos] = useState({ carreras: [], unidadesAcademicas: [], semestres: [] });
  const [errores, setErrores] = useState({});
  const [registrando, setRegistrando] = useState(false);

  // Catalogos institucionales para los selectores.
  useEffect(() => {
    servicioAutenticacion
      .obtenerConfiguracion()
      .then((datos) => setCatalogos(datos))
      .catch(() => {
        // Sin catalogos se puede escribir libremente.
      });
  }, []);

  const cambiar = (clave) => (valor) => setFormulario((actual) => ({ ...actual, [clave]: valor }));

  const validar = () => {
    const nuevos = {};
    if (formulario.nombres.trim().length < 2) nuevos.nombres = 'Ingresa tus nombres.';
    if (formulario.apellidos.trim().length < 2) nuevos.apellidos = 'Ingresa tus apellidos.';

    const correo = formulario.correo.trim().toLowerCase();
    if (!correo) nuevos.correo = 'Ingresa tu correo institucional.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) nuevos.correo = 'El correo no es valido.';
    else if (!correo.endsWith('@est.emi.edu.bo')) {
      nuevos.correo = 'Solo se aceptan correos institucionales @est.emi.edu.bo.';
    }

    if (formulario.contrasena.length < 8) nuevos.contrasena = 'La contrasena debe tener al menos 8 caracteres.';
    else if (!/[A-Za-z]/.test(formulario.contrasena) || !/[0-9]/.test(formulario.contrasena)) {
      nuevos.contrasena = 'Debe incluir al menos una letra y un numero.';
    }

    if (formulario.confirmarContrasena !== formulario.contrasena) {
      nuevos.confirmarContrasena = 'Las contrasenas no coinciden.';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!validar()) return;

    setRegistrando(true);
    try {
      await registrar({
        nombres: formulario.nombres.trim(),
        apellidos: formulario.apellidos.trim(),
        correo: formulario.correo.trim().toLowerCase(),
        contrasena: formulario.contrasena,
        confirmarContrasena: formulario.confirmarContrasena,
        carrera: formulario.carrera,
        semestre: formulario.semestre ? Number(formulario.semestre) : undefined,
        unidadAcademica: formulario.unidadAcademica,
      });
      toast.exito('Cuenta creada. Revisa tu correo institucional para el codigo de verificacion.');
      navegar('/verificar', { state: { correo: formulario.correo.trim().toLowerCase() } });
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo crear la cuenta.');
      if (error.errores && error.errores.length) {
        toast.informativo(error.errores.join(' '));
      }
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <LayoutAutenticacion
      titulo="Crear tu cuenta"
      descripcion="Solo miembros de la comunidad EMI con correo @est.emi.edu.bo."
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="enlace font-medium">
            Inicia sesion
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Nombres"
            valor={formulario.nombres}
            alCambiar={cambiar('nombres')}
            error={errores.nombres}
            requerido
            autoComplete="given-name"
          />
          <Campo
            etiqueta="Apellidos"
            valor={formulario.apellidos}
            alCambiar={cambiar('apellidos')}
            error={errores.apellidos}
            requerido
            autoComplete="family-name"
          />
        </div>

        <Campo
          etiqueta="Correo institucional"
          tipo="email"
          valor={formulario.correo}
          alCambiar={cambiar('correo')}
          marcador="nombre@est.emi.edu.bo"
          error={errores.correo}
          ayuda="El correo sera verificado con un codigo de 6 digitos."
          requerido
          autoComplete="username"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Contrasena"
            tipo="password"
            valor={formulario.contrasena}
            alCambiar={cambiar('contrasena')}
            error={errores.contrasena}
            ayuda="Minimo 8 caracteres, con letra y numero."
            requerido
            autoComplete="new-password"
          />
          <Campo
            etiqueta="Confirmar contrasena"
            tipo="password"
            valor={formulario.confirmarContrasena}
            alCambiar={cambiar('confirmarContrasena')}
            error={errores.confirmarContrasena}
            requerido
            autoComplete="new-password"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {catalogos.carreras.length > 0 ? (
            <Selector
              etiqueta="Carrera"
              valor={formulario.carrera}
              alCambiar={cambiar('carrera')}
              opciones={catalogos.carreras.map((carrera) => ({ valor: carrera, etiqueta: carrera }))}
              marcador="Selecciona tu carrera"
              requerido
            />
          ) : (
            <Campo
              etiqueta="Carrera"
              valor={formulario.carrera}
              alCambiar={cambiar('carrera')}
              marcador="Ej. Ingenieria de Sistemas"
              requerido
            />
          )}

          <Selector
            etiqueta="Semestre"
            valor={formulario.semestre}
            alCambiar={cambiar('semestre')}
            opciones={(catalogos.semestres || []).map((semestre) => ({
              valor: String(semestre),
              etiqueta: `${semestre}° semestre`,
            }))}
            marcador="Selecciona el semestre"
          />
        </div>

        <Selector
          etiqueta="Unidad academica"
          valor={formulario.unidadAcademica}
          alCambiar={cambiar('unidadAcademica')}
          opciones={(catalogos.unidadesAcademicas || []).map((unidad) => ({
            valor: unidad.codigo,
            etiqueta: unidad.nombre,
          }))}
          marcador="Selecciona tu unidad"
        />

        <Boton
          type="submit"
          variante="primario"
          tamano="grande"
          icono={UserPlus}
          cargando={registrando}
          className="w-full"
        >
          Crear cuenta
        </Boton>
      </form>
    </LayoutAutenticacion>
  );
}
