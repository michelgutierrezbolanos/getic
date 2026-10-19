# Getic App

Clon de los reportes de Getic (plaza Vallarta) con un bot como intermediario.

```
bot (Telegram/Python, aparte) ──► Supabase ◄── web (Next.js, Vercel)
        ▲                            │
        └── acciones_bot ◄───────────┴── mobile (Flutter)
```

| Carpeta | Qué es |
|---|---|
| `web/` | App web Next.js 15 + Supabase Auth. Desplegar en Vercel con *Root Directory* = `web`. |
| `mobile/` | App Flutter (Android/iOS) con login Supabase. |
| `supabase/migrations/` | Esquema SQL: `reportes`, `acciones_bot`, `perfiles`. |

## Etapa actual: inicio de sesión

Ambas apps usan **Supabase Auth (correo + password)** con el mismo estilo del login de app.getic.mx.
Crea los usuarios en *Supabase › Authentication › Users › Add user*.

### Web
```bash
cd web
cp .env.example .env.local   # ya incluye URL y publishable key
npm install
npm run dev                  # http://localhost:3000
```
En Vercel define `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### Móvil
```bash
cd mobile
flutter pub get
flutter run
```

## Flujo previsto (siguientes etapas)
1. El bot inicia sesión en Getic, lee los folios y hace *upsert* en `reportes` (con la secret key).
2. La app móvil inserta en `acciones_bot` (`tomar`, `confirmar`, `llegada`, `cierre`).
3. El bot escucha `acciones_bot` (Realtime), ejecuta la acción en Getic y marca `hecho`/`error`.
4. En `cierre` el bot envía WhatsApp con: incidente, CR, tienda, reporte de folio, solución, VoBo, atiende.

## API del bot: alta y actualización de reportes

`POST https://<tu-app>.vercel.app/api/bot/reportes`
Header `Authorization: Bearer <BOT_API_KEY>`. El body puede ser un reporte o una lista; se hace *upsert* por `folio`.

```json
[{
  "folio": "INC14911536",
  "plaza": "OPV-Prov Vallarta",
  "cliente": "OXXO MX",
  "cr": "50YYB",
  "tienda": "Guayabitos PVA",
  "tipo_registro": "Incidencia",
  "prioridad": "Alta",
  "estado": "Confirmado",
  "grupo_servicio": "CCTV",
  "concepto_servicio": "Camara",
  "categoria_opv": "OPV CCTV-HARDWARE",
  "categoria_incidencia": "OPV CCTV-HARDWARE",
  "reporte_folio": "CCTV Cámaras: No hay grabación de una ó ninguna cámara video",
  "ingeniero_asignado": "Michel Alejandro Gutiérrez Bolaños",
  "fecha_creacion": "18/10/2026 11:27 AM",
  "fecha_asignacion": "18/10/2026 19:23 PM",
  "fecha_llegada": null,
  "tiempo_restante": "15:59:36",
  "tiempo_vencido": false
}]
```

- Las fechas se aceptan tal como las muestra Getic (`dd/mm/aa hh:mm AM/PM`) o en ISO; se toman en hora del centro.
- `tiempo_restante` es el texto de Getic (`15:59:36` o `1dia(s) 21:20:24`) y `tiempo_vencido` es `true` cuando Getic lo pinta en rojo. La web lo sigue contando en vivo desde que el bot lo capturó (`tiempo_capturado_at`, automático).
- El color de la fila sale de `estado`: Confirmado → naranja, En sitio → azul, Resuelto/Cerrado → verde, cualquier otro → amarillo.

Variables extra en Vercel (solo servidor): `SUPABASE_SECRET_KEY` y `BOT_API_KEY`.

## API del bot: acciones pedidas desde la app móvil

1. `GET /api/bot/acciones?estado=pendiente` → lista de acciones con `accion`, `folio`, `payload`, `reporte`, `perfil` (nombre y email del ingeniero) y `solicitud`.
   - `tomar`, `confirmar`, `llegada`: ejecutar el botón correspondiente en Getic.
   - `cierre`: cerrar en Getic y enviar WhatsApp con `payload.whatsapp` (numero_incidente, cr, tienda, reporte_folio, solucion, vobo, atiende). Las fotos están en Storage `evidencias/` (`payload.evidencias`).
   - `checada`: marcar en Getic `payload.tipo` (`inicio`, `comida_inicio`, `comida_fin`, `salida`).
   - `solicitud`: gasolina / velocidad / tag con los datos en `payload`.
2. `PATCH /api/bot/acciones/<id>` con `{"estado":"procesando"}` al empezar y `{"estado":"hecho"}` o `{"estado":"error","error":"..."}` al terminar.
3. Después de ejecutar, vuelve a mandar el reporte actualizado a `POST /api/bot/reportes` (nuevo `estado`, fechas, tiempo).

Datos del ingeniero que carga el bot (se identifica por `email`):
- `POST /api/bot/horario` `{"email":"...","dias":[{"fecha":"2026-10-19","entrada":"09:00","comida":"13:00","salida":"18:00"},{"fecha":"2026-10-25","descanso":true}]}`
- `POST /api/bot/vehiculo` `{"email":"...","placa":"FKS316D","numero_economico":"237"}`

## Documentación completa de la API

Entra al portal → **API** (`/api-docs`): todos los endpoints con body, respuesta y ejemplo curl. `GET /api/bot` devuelve la misma lista en JSON.

Acciones del folio para el bot: `POST /api/bot/reportes/{folio}/tomar`, `/confirmar`, `/llegada` y `/cerrar` (este último con `solucion`, `vobo` y `atiende`). Solicitudes: `POST /api/bot/solicitudes`.
