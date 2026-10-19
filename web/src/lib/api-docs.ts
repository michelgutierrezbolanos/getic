// Catálogo de la API del bot. Lo usan GET /api/bot y la página /api-docs.

export type Endpoint = {
  grupo: string;
  metodo: "GET" | "POST" | "PATCH" | "DELETE";
  ruta: string;
  titulo: string;
  descripcion: string;
  query?: string;
  body?: unknown;
  respuesta?: unknown;
  /** Respeta "Enviar datos a portal alternativo": si el usuario está en NO, responde { ok, omitido: true } sin guardar. */
  respetaOpcion?: boolean;
};

export const ENDPOINTS: Endpoint[] = [
  {
    grupo: "General",
    metodo: "GET",
    ruta: "/api/bot",
    titulo: "Probar conexión",
    descripcion: "Comprueba que la clave sea correcta y devuelve la lista de endpoints.",
    respuesta: { ok: true, endpoints: [{ metodo: "GET", ruta: "/api/bot/reportes", titulo: "Listar reportes" }] },
  },
  {
    grupo: "Usuarios",
    metodo: "GET",
    ruta: "/api/bot/usuarios",
    titulo: "Listar usuarios",
    descripcion:
      "Usuarios del portal con su opción \"Enviar datos a portal alternativo\". Usa ?enviar=true para obtener solo los que la tienen en SÍ y sincronizar únicamente esos.",
    query: "enviar=true | false (opcional)",
    respuesta: [
      {
        id: "uuid",
        nombre: "Michel Gutierrez",
        email: "michel.gutierrez@getic.com.mx",
        puesto: "Ingeniero de Campo",
        rol: "admin",
        enviar_portal_alternativo: true,
      },
    ],
  },
  {
    grupo: "Reportes",
    metodo: "GET",
    ruta: "/api/bot/reportes",
    titulo: "Listar reportes",
    descripcion: "Todos los reportes guardados en el portal.",
    query: "activos=true (sin cerrados), estado=Confirmado (opcional)",
  },
  {
    grupo: "Reportes",
    metodo: "POST",
    ruta: "/api/bot/reportes",
    titulo: "Crear o actualizar reportes",
    descripcion:
      "Upsert por folio. Acepta un reporte, una lista, o { email, reportes } para aplicar la opción del usuario. Las fechas pueden ir como en Getic (dd/mm/aaaa hh:mm AM/PM).",
    respetaOpcion: true,
    body: {
      email: "michel.gutierrez@getic.com.mx",
      reportes: [
        {
          folio: "INC14911536",
          plaza: "OPV-Prov Vallarta",
          cliente: "OXXO MX",
          cr: "50YYB",
          tienda: "Guayabitos PVA",
          tipo_registro: "Incidencia",
          prioridad: "Alta",
          estado: "Confirmado",
          grupo_servicio: "CCTV",
          concepto_servicio: "Camara",
          categoria_opv: "OPV CCTV-HARDWARE",
          categoria_incidencia: "OPV CCTV-HARDWARE",
          reporte_folio: "CCTV Cámaras: No hay grabación de una ó ninguna cámara video",
          ingeniero_asignado: "Michel Alejandro Gutiérrez Bolaños",
          ati: null,
          fecha_creacion: "18/10/2026 11:27 AM",
          fecha_asignacion: "18/10/2026 19:23 PM",
          fecha_confirmacion: "18/10/2026 19:23 PM",
          fecha_llegada: null,
          fecha_resuelto: null,
          tiempo_restante: "15:59:36",
          tiempo_vencido: false,
        },
      ],
    },
    respuesta: { ok: true, guardados: ["INC14911536"] },
  },
  {
    grupo: "Reportes",
    metodo: "GET",
    ruta: "/api/bot/reportes/{folio}",
    titulo: "Ver un reporte",
    descripcion: "Todos los campos del folio, incluida la solución, VoBo, atiende y evidencias del cierre.",
  },
  {
    grupo: "Reportes",
    metodo: "PATCH",
    ruta: "/api/bot/reportes/{folio}",
    titulo: "Actualizar campos de un reporte",
    descripcion: "Manda solo lo que cambió (por ejemplo después de marcar llegada en Getic).",
    body: { estado: "En sitio", fecha_llegada: "18/10/2026 08:15 PM", tiempo_restante: "1:20:00" },
    respuesta: { ok: true, reporte: { folio: "INC14911536", estado: "En sitio" } },
  },
  {
    grupo: "Reportes",
    metodo: "DELETE",
    ruta: "/api/bot/reportes/{folio}",
    titulo: "Borrar un reporte",
    descripcion: "Para folios que ya no existen en Getic.",
    respuesta: { ok: true },
  },
  {
    grupo: "Acciones de la app",
    metodo: "GET",
    ruta: "/api/bot/acciones",
    titulo: "Acciones pendientes",
    descripcion:
      "Lo que el usuario pidió desde la app y el bot debe ejecutar en Getic. accion: tomar | confirmar | llegada | cierre | checada | solicitud. En cierre, payload.whatsapp trae el mensaje listo.",
    query: "estado=pendiente (por defecto) | procesando | hecho | error, limit=50",
    respuesta: [
      {
        id: 12,
        folio: "INC14911536",
        accion: "cierre",
        estado: "pendiente",
        payload: {
          whatsapp: {
            numero_incidente: "INC14911536",
            cr: "50YYB",
            tienda: "Guayabitos PVA",
            reporte_folio: "CCTV Cámaras: No hay grabación…",
            solucion: "Se reinició el DVR y se reconfiguró la cámara 3",
            vobo: "Gerente de tienda",
            atiende: "Michel Gutierrez",
          },
          folio_falso: null,
          evidencias: ["INC14911536/1729300000_0.jpg"],
        },
        reporte: { folio: "INC14911536", "…": "…" },
        perfil: { nombre: "Michel Gutierrez", email: "michel.gutierrez@getic.com.mx", enviar_portal_alternativo: true },
        solicitud: null,
      },
    ],
  },
  {
    grupo: "Acciones de la app",
    metodo: "PATCH",
    ruta: "/api/bot/acciones/{id}",
    titulo: "Marcar resultado de una acción",
    descripcion:
      "procesando al empezar; hecho o error al terminar. Para checada y solicitud también actualiza su estado en la app.",
    body: { estado: "hecho", error: null },
    respuesta: { ok: true },
  },
  {
    grupo: "Checador",
    metodo: "GET",
    ruta: "/api/bot/checadas",
    titulo: "Checadas del día",
    descripcion: "Checadas de un usuario en una fecha (hoy por defecto).",
    query: "email=..., fecha=2026-10-19 (opcional)",
  },
  {
    grupo: "Checador",
    metodo: "POST",
    ruta: "/api/bot/checadas",
    titulo: "Registrar checada hecha en Getic",
    descripcion: "tipo: inicio | comida_inicio | comida_fin | salida.",
    respetaOpcion: true,
    body: { email: "michel.gutierrez@getic.com.mx", tipo: "inicio", hora: "19/10/2026 08:28 AM" },
    respuesta: { ok: true },
  },
  {
    grupo: "Horario",
    metodo: "GET",
    ruta: "/api/bot/horario",
    titulo: "Ver horario",
    descripcion: "Horario guardado de un usuario.",
    query: "email=..., desde=2026-10-19, hasta=2026-10-25 (opcionales)",
  },
  {
    grupo: "Horario",
    metodo: "POST",
    ruta: "/api/bot/horario",
    titulo: "Cargar horario",
    descripcion: "Upsert por día. Los días de descanso van con descanso: true.",
    respetaOpcion: true,
    body: {
      email: "michel.gutierrez@getic.com.mx",
      dias: [
        { fecha: "2026-10-19", entrada: "09:00", comida: "13:00", salida: "18:00" },
        { fecha: "2026-10-24", descanso: true },
      ],
    },
    respuesta: { ok: true, dias: 2 },
  },
  {
    grupo: "Vehículo",
    metodo: "GET",
    ruta: "/api/bot/vehiculo",
    titulo: "Ver vehículo asignado",
    descripcion: "Vehículo del usuario (null si no tiene).",
    query: "email=...",
  },
  {
    grupo: "Vehículo",
    metodo: "POST",
    ruta: "/api/bot/vehiculo",
    titulo: "Asignar vehículo",
    descripcion: "Para quitarlo manda placa y numero_economico en null.",
    respetaOpcion: true,
    body: { email: "michel.gutierrez@getic.com.mx", placa: "FKS316D", numero_economico: "237" },
    respuesta: { ok: true },
  },
  {
    grupo: "Solicitudes",
    metodo: "GET",
    ruta: "/api/bot/solicitudes",
    titulo: "Listar solicitudes",
    descripcion: "Gasolina, aumento de velocidad y TAG, con el usuario que la pidió.",
    query: "estado=pendiente, email=... (opcionales)",
  },
  {
    grupo: "Solicitudes",
    metodo: "PATCH",
    ruta: "/api/bot/solicitudes/{id}",
    titulo: "Cambiar estado de una solicitud",
    descripcion: "estado: pendiente | enviada | aprobada | rechazada | error.",
    body: { estado: "aprobada" },
    respuesta: { ok: true },
  },
];
