import {
  Home,
  User,
  Users,
  UsersRound,
  CalendarDays,
  MessageSquare,
  Store,
  Bookmark,
  Bell,
  Settings,
  Search,
  LayoutDashboard,
  FileText,
  Flag,
  BarChart3,
} from 'lucide-react';

/** Menu lateral principal (escritorio). */
export const ELEMENTOS_NAVEGACION = [
  { ruta: '/inicio', etiqueta: 'Inicio', icono: Home },
  { ruta: '/perfil', etiqueta: 'Mi perfil', icono: User },
  { ruta: '/amigos', etiqueta: 'Amigos', icono: Users },
  { ruta: '/comunidades', etiqueta: 'Comunidades', icono: UsersRound },
  { ruta: '/eventos', etiqueta: 'Eventos', icono: CalendarDays },
  { ruta: '/mensajes', etiqueta: 'Mensajes', icono: MessageSquare, contador: 'mensajes' },
  { ruta: '/marketplace', etiqueta: 'Marketplace', icono: Store },
  { ruta: '/guardados', etiqueta: 'Guardados', icono: Bookmark },
  { ruta: '/buscar', etiqueta: 'Buscar', icono: Search },
  { ruta: '/notificaciones', etiqueta: 'Notificaciones', icono: Bell, contador: 'notificaciones' },
  { ruta: '/configuracion', etiqueta: 'Configuracion', icono: Settings },
];

/** Menu inferior en movil (solo funciones principales). */
export const ELEMENTOS_MOVIL = [
  { ruta: '/inicio', etiqueta: 'Inicio', icono: Home },
  { ruta: '/comunidades', etiqueta: 'Comunidades', icono: UsersRound },
  { ruta: '/mensajes', etiqueta: 'Mensajes', icono: MessageSquare, contador: 'mensajes' },
  { ruta: '/eventos', etiqueta: 'Eventos', icono: CalendarDays },
  { ruta: '/notificaciones', etiqueta: 'Avisos', icono: Bell, contador: 'notificaciones' },
];

/** Menu del panel administrativo. */
export const ELEMENTOS_ADMINISTRACION = [
  { ruta: '/administracion', etiqueta: 'Resumen', icono: LayoutDashboard },
  { ruta: '/administracion/usuarios', etiqueta: 'Usuarios', icono: Users },
  { ruta: '/administracion/publicaciones', etiqueta: 'Publicaciones', icono: FileText },
  { ruta: '/administracion/comunidades', etiqueta: 'Comunidades', icono: UsersRound },
  { ruta: '/administracion/reportes', etiqueta: 'Reportes', icono: Flag, contador: 'reportes' },
  { ruta: '/administracion/estadisticas', etiqueta: 'Estadisticas', icono: BarChart3 },
];
