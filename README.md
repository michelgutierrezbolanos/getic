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
