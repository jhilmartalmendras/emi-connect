import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Users, Zap } from 'lucide-react';
import { IDENTIDAD } from '../../constantes/identidad';

const VENTAJAS = [
  { icono: Users, texto: 'Conectate con estudiantes, docentes y egresados de la EMI.' },
  { icono: GraduationCap, texto: 'Comunidades academicas, eventos y grupos de estudio.' },
  { icono: ShieldCheck, texto: 'Acceso exclusivo con correo institucional @est.emi.edu.bo.' },
  { icono: Zap, texto: 'Mensajeria en tiempo real, marketplace y recomendaciones.' },
];

/**
 * Estructura visual de las paginas de acceso (login, registro, recuperacion).
 * Panel institucional a la izquierda y formulario a la derecha.
 */
export function LayoutAutenticacion({ titulo, descripcion, children, pie = null }) {
  return (
    <div className="min-h-screen bg-emi-50 lg:grid lg:grid-cols-2 dark:bg-emi-950">
      {/* Panel institucional */}
      <section className="hidden flex-col justify-between bg-gradient-to-br from-emi-900 via-emi-800 to-emi-950 p-12 text-white lg:flex">
        <Link to="/login" className="flex items-center gap-3" aria-label="Ir al inicio de sesion">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold">
            {IDENTIDAD.siglas}
          </span>
          <span>
            <span className="block text-xl font-bold">{IDENTIDAD.nombrePlataforma}</span>
            <span className="block text-sm text-emi-200">{IDENTIDAD.nombreInstitucion}</span>
          </span>
        </Link>

        <div>
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            La red social universitaria privada de la comunidad EMI.
          </h1>
          <p className="mt-3 max-w-md text-emi-200">{IDENTIDAD.descripcion}</p>

          <ul className="mt-8 space-y-4">
            {VENTAJAS.map((ventaja) => {
              const Icono = ventaja.icono;
              return (
                <li key={ventaja.texto} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icono className="h-4 w-4 text-dorado-400" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-emi-100">{ventaja.texto}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-emi-300">
          © {IDENTIDAD.anio} {IDENTIDAD.nombrePlataforma} · {IDENTIDAD.lema}
        </p>
      </section>

      {/* Formulario */}
      <section className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emi-900 text-sm font-bold text-white">
              {IDENTIDAD.siglas}
            </span>
            <span>
              <span className="block font-bold text-emi-900 dark:text-emi-50">{IDENTIDAD.nombrePlataforma}</span>
              <span className="block text-xs text-emi-500 dark:text-emi-300">{IDENTIDAD.nombreInstitucion}</span>
            </span>
          </div>

          <div className="tarjeta p-6 sm:p-8 animar-entrada">
            <h2 className="text-xl font-bold text-emi-900 dark:text-emi-50">{titulo}</h2>
            {descripcion && <p className="mt-1 texto-secundario">{descripcion}</p>}

            <div className="mt-6">{children}</div>
          </div>

          {pie && <div className="mt-4 text-center text-sm texto-secundario">{pie}</div>}
        </div>
      </section>
    </div>
  );
}

export default LayoutAutenticacion;
