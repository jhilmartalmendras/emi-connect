# EMI Connect — Frontend

Interfaz de usuario de **EMI Connect**, desarrollada con React + Vite + Tailwind CSS + React Router + Axios.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run desarrollo` | Servidor de desarrollo Vite en `http://localhost:5173` |
| `npm run construir` | Compilar para producción (`dist/assets/index-*.js`) |
| `npm run previsualizar` | Preview de la compilacion |

## Stack

- **React 18** + **React Router 6** (lazy loading + Suspense)
- **Vite 5** con `build.target: 'es2015'` (compatibilidad Windows 8/8.1)
- **Tailwind CSS 3** con `darkMode: 'class'`
- **Axios** para la API, **Socket.IO client** para tiempo real
- **Lucide React** para iconos

## Jerarquía de componentes

- **Componentes comunes**: `Boton`, `Modal`, `Avatar`, `Esqueleto`, `MenuDesplegable`, `ModalReporte`, `Cargador`, `EntradaTexto`, `AreaTexto`, `Selector`, `Casilla`.
- **Componentes de contenido**: `TarjetaPublicacion`, `EditorPublicacion`, `SelectorReaccion`, `ListaComentarios`, `ComponenteComentario`, `TarjetaUsuario`, `TarjetaComunidad`, `TarjetaEvento`, `TarjetaProducto`.
- **Componentes de diseño**: `BarraLateral`, `BarraSuperior`, `MenuMovil`, `PanelDerecho`, `LayoutPrincipal`.
- **Páginas**: `Inicio`, `Perfil`, `Amigos`, `Comunidades`, `DetalleComunidad`, `Eventos`, `DetalleEvento`, `Mensajes`, `Marketplace`, `DetalleProducto`, `Guardados`, `Notificaciones`, `Configuracion`, `Buscar`, `PaginaPublicacion`, `NoEncontrada`, y las de administración: `Resumen`, `Estadisticas`, `Usuarios`, `Publicaciones`, `Comunidades`, `Reportes`.
- **Páginas de autenticación**: `Login`, `Registro`, `Verificar`, `Recuperar`, `Restablecer`, `LayoutAutenticacion`.

## Estado de la sesión

El contexto `Autenticacion` (junto con `Contadores` y `Socket`) gestiona el usuario, el token y los contadores globales. El router se define en `App.jsx` con las rutas públicas, privadas y de administración.

## Prueba de sintaxis

```bash
node revisar-sintaxis.cjs
```

## Compatibilidad

- `vite.config.js` usa `build.target: 'es2015'` para Windows 8/8.1.
- Tailwind `darkMode: 'class'` y colores `emi` (azul) + `dorado` (prototipo institucional).
