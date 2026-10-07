const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { repositorioEvento } = require('../repositorios/repositorioEvento');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioProducto } = require('../repositorios/repositorioProducto');
const { servicioRecomendacion } = require('./servicioRecomendacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

/**
 * Asistente de EMI Connect (preparacion para IA).
 *
 * La plataforma expone una unica funcion "responder" que hoy resuelve las
 * consultas con reglas locales y busquedas en MongoDB. Para conectar un modelo
 * de lenguaje en el futuro solo hay que reemplazar el cuerpo de "responder"
 * (por ejemplo llamando a una API externa) manteniendo la misma firma; los
 * controladores y el frontend no necesitan cambios.
 *
 * Las intenciones reconocidas son:
 *   buscar_publicaciones, buscar_comunidades, buscar_eventos,
 *   recomendar_comunidades, recomendar_usuarios, buscar_productos, ayuda
 */
const servicioAsistenteIA = {
  /** Clasifica la consulta del usuario en una intencion conocida. */
  detectarIntencion(consulta) {
    const texto = String(consulta || '').toLowerCase();

    if (/(publicacion|publicaciones|post|aviso)/.test(texto)) return 'buscar_publicaciones';
    if (/(comunidad|comunidades|grupo|grupos)/.test(texto)) return 'buscar_comunidades';
    if (/(evento|eventos|actividad|actividades|charla|feria)/.test(texto)) return 'buscar_eventos';
    if (/(comprar|vender|producto|productos|precio|marketplace)/.test(texto)) return 'buscar_productos';
    if (/(usuario|usuarios|compañero|companero|estudiante|docente)/.test(texto)) return 'recomendar_usuarios';
    if (/(recomiend|sugerencia|sugerime|que me conviene)/.test(texto)) return 'recomendar_comunidades';

    return 'ayuda';
  },

  /** Extrae las palabras clave utiles de la consulta. */
  extraerPalabrasClave(consulta) {
    const palabrasVacias = new Set([
      'que', 'como', 'donde', 'cuando', 'cual', 'cuales', 'para', 'por', 'con', 'los', 'las', 'del',
      'una', 'uno', 'unos', 'unas', 'hay', 'buscar', 'busca', 'muestra', 'mostrar', 'dame', 'sobre',
      'the', 'and', 'emi', 'connect', 'quiero', 'necesito', 'puedes', 'me',
    ]);

    return String(consulta || '')
      .toLowerCase()
      .replace(/[^\wáéíóúñ\s]/g, ' ')
      .split(/\s+/)
      .filter((palabra) => palabra.length > 2 && !palabrasVacias.has(palabra))
      .slice(0, 5);
  },

  /** Punto de entrada unico del asistente. */
  async responder(usuarioId, consulta) {
    const texto = String(consulta || '').trim();
    if (texto.length < 3) {
      throw ErrorAplicacion.solicitudInvalida('Escribe una consulta mas larga para que el asistente la entienda.');
    }

    const intencion = this.detectarIntencion(texto);
    const palabras = this.extraerPalabrasClave(texto);
    const termino = palabras[0] || texto.split(' ')[0];

    const respuestas = {
      buscar_publicaciones: async () => {
        const publicaciones = await repositorioPublicacion.buscarPorTexto(termino, { limite: 5 });
        return {
          respuesta:
            publicaciones.length > 0
              ? `Encontre ${publicaciones.length} publicacion(es) relacionadas con "${termino}".`
              : `No encontre publicaciones relacionadas con "${termino}".`,
          resultados: { publicaciones },
        };
      },
      buscar_comunidades: async () => {
        const comunidades = await repositorioComunidad.buscarPorTexto(termino, { limite: 5 });
        return {
          respuesta:
            comunidades.length > 0
              ? `Estas comunidades pueden interesarte (${comunidades.length}):`
              : `No encontre comunidades relacionadas con "${termino}".`,
          resultados: { comunidades },
        };
      },
      buscar_eventos: async () => {
        const eventos = await repositorioEvento.buscarPorTexto(termino, { limite: 5 });
        return {
          respuesta:
            eventos.length > 0
              ? `Estos eventos estan relacionados con tu busqueda:`
              : 'Por ahora no hay eventos que coincidan con tu busqueda. Te muestro los proximos eventos.',
          resultados: { eventos: eventos.length > 0 ? eventos : await repositorioEvento.listarProximos({ limite: 5 }) },
        };
      },
      buscar_productos: async () => {
        const productos = await repositorioProducto.buscarPorTexto(termino, { limite: 5 });
        return {
          respuesta:
            productos.length > 0
              ? `Encontre ${productos.length} producto(s) en el marketplace.`
              : `No hay productos publicados con "${termino}".`,
          resultados: { productos },
        };
      },
      recomendar_usuarios: async () => {
        const usuarios = await servicioRecomendacion.recomendarUsuarios(usuarioId, 5);
        return {
          respuesta: 'Estos usuarios comparten tu carrera, semestre o intereses:',
          resultados: { usuarios: usuarios.map((elemento) => ({ ...elemento.usuario, motivos: elemento.motivos })) },
        };
      },
      recomendar_comunidades: async () => {
        const comunidades = await servicioRecomendacion.recomendarComunidades(usuarioId, 4);
        return {
          respuesta: 'Segun tu perfil, estas comunidades te pueden interesar:',
          resultados: { comunidades: comunidades.map((elemento) => elemento.comunidad) },
        };
      },
      ayuda: async () => ({
        respuesta:
          'Puedo ayudarte a encontrar publicaciones, comunidades, eventos y productos. Por ejemplo: ' +
          '"publicaciones sobre robotica", "comunidades de inteligencia artificial" o "eventos de esta semana".',
        resultados: {},
      }),
    };

    const resultado = await respuestas[intencion]();

    return {
      consulta: texto,
      intencion,
      palabrasClave: palabras,
      ...resultado,
      // Marca de la implementacion actual; al conectar un modelo real cambia a "modelo_ia".
      motor: 'reglas_locales',
    };
  },

  /** Sugerencias rapidas para la interfaz del asistente. */
  sugerencias() {
    return [
      'Publicaciones sobre inteligencia artificial',
      'Comunidades de robotica',
      'Eventos de esta semana',
      'Productos de libros',
    ];
  },
};

module.exports = { servicioAsistenteIA };
