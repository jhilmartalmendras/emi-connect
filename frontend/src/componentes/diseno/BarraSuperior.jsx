import { Link, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, LogOut, User, Settings, Shield } from 'lucide-react';
import { useState } from 'react';
import { BuscadorGlobal } from '../busqueda/BuscadorGlobal';
import { MenuNotificaciones } from '../notificaciones/MenuNotificaciones';
import { Avatar } from '../comunes/Avatar';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useTema } from '../../contexto/ContextoTema';
import { useClickExterno } from '../../hooks/useClickExterno';
import { useContadores } from '../../contexto/ContextoContadores';
import { IDENTIDAD } from '../../constantes/identidad';
import { nombreCompleto } from '../../utilidades/textos';

/**
 * Barra superior fija: marca, buscador global, notificaciones, tema y sesion.
 * En movil se reduce a marca, buscador, campana y avatar.
 */
export function BarraSuperior() {
  const { usuario, cerrarSesion, esAdministracion } = useAutenticacion();
  const { tema, alternarTema } = useTema();
  const { contadores } = useContadores();
  const navegar = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const referencia = useClickExterno(menuAbierto, () => setMenuAbierto(false));

  const cerrar = async () => {
    setMenuAbierto(false);
    await cerrarSesion();
    navegar('/login');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-emi-100 bg-white/90 backdrop-blur dark:border-emi-800 dark:bg-emi-900/90 lg:left-64">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4">
        {/* Marca (solo movil; en escritorio esta en la barra lateral) */}
        <Link to="/inicio" className="flex items-center gap-2 lg:hidden" aria-label="Ir al inicio">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emi-900 text-sm font-bold text-white dark:bg-emi-700">
            {IDENTIDAD.siglas}
          </span>
        </Link>

        {/* Buscador */}
        <div className="hidden flex-1 sm:block sm:max-w-md">
          <BuscadorGlobal compacto />
        </div>
        <Link
          to="/buscar"
          className="rounded-full p-2.5 text-emi-500 transition hover:bg-emi-100 sm:hidden dark:text-emi-200 dark:hover:bg-emi-800"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </Link>

        <div className="ml-auto flex items-center gap-1">
          {/* Tema claro/oscuro */}
          <button
            type="button"
            onClick={alternarTema}
            className="rounded-full p-2.5 text-emi-500 transition hover:bg-emi-100 dark:text-emi-200 dark:hover:bg-emi-800"
            aria-label={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}
          >
            {tema === 'oscuro' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>

          {/* Notificaciones */}
          <MenuNotificaciones />

          {/* Solicitud de amistad pendiente (acceso rapido) */}
          {contadores.solicitudes > 0 && (
            <Link
              to="/amigos?pestana=solicitudes"
              className="relative hidden rounded-full p-2.5 text-emi-500 transition hover:bg-emi-100 sm:block dark:text-emi-200 dark:hover:bg-emi-800"
              aria-label={`${contadores.solicitudes} solicitudes de amistad pendientes`}
            >
              <User className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emi-600 px-1 text-[10px] font-bold text-white">
                {contadores.solicitudes > 99 ? '99+' : contadores.solicitudes}
              </span>
            </Link>
          )}

          {/* Menu de la sesion */}
          <div className="relative" ref={referencia}>
            <button
              type="button"
              onClick={() => setMenuAbierto((valor) => !valor)}
              className="flex items-center gap-2 rounded-full p-1 transition hover:bg-emi-100 dark:hover:bg-emi-800"
              aria-haspopup="menu"
              aria-expanded={menuAbierto}
              aria-label="Menu de la sesion"
            >
              <Avatar usuario={usuario} tamanos="pequeno" />
            </button>

            {menuAbierto && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-emi-100 bg-white py-1 shadow-tarjeta animar-entrada dark:border-emi-700 dark:bg-emi-900"
              >
                <div className="border-b border-emi-100 px-4 py-3 dark:border-emi-800">
                  <p className="truncate text-sm font-semibold text-emi-900 dark:text-emi-50">
                    {nombreCompleto(usuario)}
                  </p>
                  <p className="truncate text-xs text-emi-500 dark:text-emi-300">{usuario?.correo}</p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuAbierto(false);
                    navegar('/perfil');
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-emi-700 transition hover:bg-emi-50 dark:text-emi-100 dark:hover:bg-emi-800"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Mi perfil
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuAbierto(false);
                    navegar('/configuracion');
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-emi-700 transition hover:bg-emi-50 dark:text-emi-100 dark:hover:bg-emi-800"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Configuracion
                </button>

                {esAdministracion && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAbierto(false);
                      navegar('/administracion');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-emi-700 transition hover:bg-emi-50 dark:text-emi-100 dark:hover:bg-emi-800"
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    Panel administrativo
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={cerrar}
                  className="flex w-full items-center gap-2.5 border-t border-emi-100 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:border-emi-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default BarraSuperior;
