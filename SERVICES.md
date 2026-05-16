# SharpBet — Servicios y APIs

Guía de referencia de todos los servicios externos que usa la plataforma: para qué sirven, sus límites actuales y qué hacer cuando la plataforma crezca.

---

## 1. Supabase — Base de datos, Auth y Edge Functions

**Web**: supabase.com  
**Plan actual**: Free

### Para qué lo usamos
- **Base de datos PostgreSQL**: toda la lógica de la app (profiles, bets, events, rewards, redemptions, referrals…)
- **Autenticación**: login con email/password, Google y Apple
- **Auth Admin API**: panel de admin (listar usuarios, borrarlos, enviar reset de contraseña)
- **Edge Functions**: dos funciones Deno desplegadas:
  - `resolve-finished-events` — cron cada 4h que comprueba resultados y resuelve apuestas
  - `send-redemption-email` — envía email al usuario cuando cambia el estado de un canje
- **Storage**: avatares de usuario
- **RLS (Row Level Security)**: cada usuario solo lee/escribe sus propios datos

### Límites del plan Free
| Recurso | Límite Free |
|---|---|
| Base de datos | 500 MB |
| Usuarios auth | Ilimitados |
| Edge Functions | 500.000 invocaciones/mes |
| Storage | 1 GB |
| Bandwidth | 5 GB/mes |
| Proyectos activos | 2 |

### Cuándo escalar
- **Primero lo notarás en**: ancho de banda (5 GB) si hay muchos usuarios activos, o en almacenamiento (500 MB) si la DB crece mucho.
- **Plan Pro** (~$25/mes): 8 GB DB, 250 GB bandwidth, backups diarios. Recomendable cuando superes los 1.000 usuarios activos o notes la DB por encima de 300 MB.

---

## 2. The Odds API — Datos deportivos y resultados

**Web**: the-odds-api.com  
**Variable**: `ODDS_API_KEY`  
**Plan actual**: Free

### Para qué lo usamos
- Obtener la lista de deportes disponibles
- Importar eventos con cuotas (moneyline, spreads, totals)
- Resolver apuestas: consultamos los scores de eventos pasados para marcar ganadores/perdedores
- La Edge Function `resolve-finished-events` la llama cada 4 horas

### Límites del plan Free
| Recurso | Límite |
|---|---|
| Créditos mensuales | 500 |
| Deportes disponibles | Todos |
| Histórico de scores | Últimos 3 días |

**Consumo actual**: ~1 crédito por deporte consultado en el cron. Con 4h de intervalo y los deportes activos en ese momento, el consumo es bajo (estimado 100-200 créditos/mes si hay actividad moderada).

### Cuándo escalar
- Si superas los 500 créditos/mes o necesitas más histórico de resultados.
- **Plan Starter** (~$10/mes): 10.000 créditos/mes. Suficiente para escala media.

---

## 3. Resend — Envío de emails transaccionales

**Web**: resend.com  
**Variable**: `RESEND_API_KEY`  
**Dominio configurado**: `@sharpbet.es`  
**Plan actual**: Free

### Para qué lo usamos
- SMTP personalizado para los emails de autenticación de Supabase (reset de contraseña, bienvenida…)
- Emails de notificación de canjes (enviados desde la Edge Function `send-redemption-email`)

### Límites del plan Free
| Recurso | Límite |
|---|---|
| Emails/mes | 3.000 |
| Emails/día | 100 |
| Dominios | 1 |

### Cuándo escalar
- Si superas los 100 emails/día (con muchos registros + actividad de canjes).
- **Plan Pro** (~$20/mes): 50.000 emails/mes, sin límite diario.

---

## 4. CPX Research — Offerwall de encuestas

**Web**: cpx-research.com  
**Variables**: `NEXT_PUBLIC_CPX_APP_ID`, `CPX_SECURITY_HASH`  
**Estado**: Activo

### Para qué lo usamos
- Offerwall principal en la sección "Ganar puntos"
- El usuario completa encuestas y gana puntos
- CPX llama a nuestro webhook `/api/offerwall/cpx` cuando completa una tarea
- Verificamos la firma HMAC con `CPX_SECURITY_HASH` antes de abonar los puntos

### Modelo de negocio
CPX nos paga en USD por encuesta completada. Nosotros abonamos puntos al usuario. El margen depende de nuestra conversión puntos → premios.

### Cuándo revisar
- Si el volumen de usuarios crece, pueden ofrecerte mejores CPCs negociando directamente con CPX.
- No hay límite técnico de escala en este servicio.

---

## 5. BitLabs — Offerwall de encuestas

**Web**: bitlabs.ai  
**Variables**: `NEXT_PUBLIC_BITLABS_APP_TOKEN`, `BITLABS_SECRET_KEY`  
**Estado**: Pendiente de aprobación del publisher

### Para qué lo usamos
- Segunda offerwall, misma mecánica que CPX
- Webhook en `/api/offerwall/bitlabs`

### Cuándo revisar
- Activar una vez aprobados. Si CPX falla o tiene pocas encuestas disponibles, BitLabs actúa como fallback.

---

## 6. TheoremReach — Offerwall de encuestas

**Web**: theoremreach.com  
**Variables**: `NEXT_PUBLIC_THEOREM_REACH_API_KEY`, `THEOREM_REACH_SECRET`  
**Estado**: Pendiente confirmación de ownership

### Para qué lo usamos
- Tercera offerwall, misma mecánica
- Webhook en `/api/offerwall/theoremreach`

---

## 7. AdGem — Offerwall (mobile-only)

**Web**: adgem.com  
**Variables**: `NEXT_PUBLIC_ADGEM_APP_ID`, `ADGEM_POSTBACK_KEY`  
**Estado**: Pendiente de aprobación

### Para qué lo usamos
- Offerwall específica para móvil (se muestra solo en mobile)
- Webhook en `/api/offerwall/adgem`

---

## 8. Monlix — Offerwall de encuestas

**Variables**: `MONLIX_SECRET_KEY`  
**Estado**: Integrado, pendiente activación

### Para qué lo usamos
- Offerwall adicional, webhook en `/api/offerwall/monlix`

---

## 9. Adsterra — Red de anuncios display

**Web**: adsterra.com  
**Plan actual**: Publisher (ingresos por CPM/CPC)

### Para qué lo usamos
- Banner 300×250 en el aside derecho (desktop)
- Banner 320×50 encima del menú inferior (mobile)
- Los scripts se inyectan via `AdsterraUnit.tsx` con claves hardcodeadas (son públicas por diseño)

### Claves actuales
- Desktop 300×250: `789b5ee37dbebca06e32b1d84247c967`
- Mobile 320×50: `dae339dd05e406edbd65799672f60e96`

### Cuándo revisar
- Adsterra paga bien cuando hay volumen. Si el tráfico crece, considera negociar una tasa garantizada o probar con Google AdSense (ya integrado en el código, pendiente de aprobación) en paralelo.

---

## 10. Google AdSense

**Web**: adsense.google.com  
**Publisher ID**: `ca-pub-9606090335798660`  
**Estado**: Pendiente de aprobación

### Para qué lo usamos
- Anuncios display alternativos a Adsterra
- Ya está el script en `layout.tsx`, se activa cuando AdSense apruebe la cuenta

### Cuándo revisar
- AdSense suele pagar más por impresión que Adsterra en mercados como España, pero requiere más tráfico y contenido para ser aprobado.

---

## 11. Football-Data.org — Logos de equipos de fútbol

**Web**: football-data.org  
**Variable**: `FOOTBALL_DATA_API_KEY`  
**Plan actual**: Free

### Para qué lo usamos
- Obtener los escudos (crests) de equipos de fútbol europeo
- Se llama desde `/api/team-logo` cuando se importan eventos

### Límites del plan Free
- 10 requests/minuto
- Competiciones limitadas (solo las principales europeas)

### Cuándo escalar
- Solo si añades muchas competiciones de fútbol. Para uso actual es más que suficiente.

---

## 12. ESPN API — Logos de equipos (otros deportes)

**Web**: site.api.espn.com (API pública, sin auth)  
**Sin clave de API**

### Para qué lo usamos
- Logos de equipos de NBA, NFL, MLB, NHL
- También desde `/api/team-logo`

### Límites
- API no oficial, sin SLA. Funciona bien pero puede cambiar sin aviso.
- Si deja de funcionar, alternativa: usar SportsDB (thesportsdb.com) que también es gratis.

---

## 13. Google Fonts

**Fuentes**: Barlow Condensed (display), Inter (texto)  
**Sin clave de API**

### Para qué lo usamos
- Tipografías del diseño cargadas en el `layout.tsx` raíz
- Se cachean automáticamente en el build de Next.js

### Cuándo revisar
- Nunca, a menos que quieras autoalojar las fuentes para mejorar el Core Web Vitals (marginal).

---

## 14. Vercel Analytics

**Web**: vercel.com/analytics  
**Paquete**: `@vercel/analytics`  
**Plan actual**: Free (con el hosting de Vercel)

### Para qué lo usamos
- Métricas de tráfico y Core Web Vitals
- Componente `<Analytics />` en el layout raíz

### Cuándo revisar
- El plan Pro de Vercel incluye más datos de analytics. Si necesitas funnels o eventos custom, considera añadir PostHog o Mixpanel.

---

## Resumen de prioridades de escala

| Prioridad | Servicio | Señal de alerta | Acción |
|---|---|---|---|
| 🔴 Alta | **Supabase** | DB > 300 MB o bandwidth > 4 GB/mes | Subir a Pro ($25/mes) |
| 🔴 Alta | **Resend** | > 80 emails/día | Subir a Pro ($20/mes) |
| 🟡 Media | **The Odds API** | > 400 créditos/mes | Subir a Starter ($10/mes) |
| 🟢 Baja | **Football-Data** | Muchas competiciones nuevas | Subir plan si necesitas más ligas |
| 🟢 Baja | **Adsterra / AdSense** | Tráfico alto | Negociar tasa o activar AdSense |

---

## Variables de entorno — referencia rápida

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=

# Odds / Deportes
ODDS_API_KEY=
FOOTBALL_DATA_API_KEY=

# Email
RESEND_API_KEY=

# Offerwalls
NEXT_PUBLIC_CPX_APP_ID=
CPX_SECURITY_HASH=
NEXT_PUBLIC_BITLABS_APP_TOKEN=
BITLABS_SECRET_KEY=
NEXT_PUBLIC_THEOREM_REACH_API_KEY=
THEOREM_REACH_SECRET=
NEXT_PUBLIC_ADGEM_APP_ID=
ADGEM_POSTBACK_KEY=
MONLIX_SECRET_KEY=
```

> Las variables `NEXT_PUBLIC_*` son visibles en el cliente (browser). Las demás son secretas y solo viven en el servidor / Edge Functions de Supabase.
