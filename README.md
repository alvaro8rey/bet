# 🎯 PlayfulBet

Plataforma de predicciones deportivas con puntos virtuales. Moderna, responsive y lista para producción.

**Stack:** Next.js 15 · TypeScript · TailwindCSS · Supabase · PostgreSQL

---

## 🚀 Instalación rápida

```bash
# 1. Clona o descomprime el proyecto
cd playfulbet

# 2. Instala dependencias
npm install

# 3. Configura las variables de entorno
cp .env.local.example .env.local
# Edita .env.local con tus credenciales de Supabase

# 4. Ejecuta en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

---

## ⚙️ Configuración de Supabase

### 1. Crea un proyecto en Supabase

Ve a [supabase.com](https://supabase.com) → New Project.

### 2. Copia las credenciales

En tu proyecto Supabase → **Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public key
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key

Pégalas en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3. Ejecuta el schema SQL

En Supabase → **SQL Editor** → New query → pega el contenido de `supabase/schema.sql` → Run.

Esto crea:
- Tabla `profiles` con RLS
- Tabla `events` con RLS
- Tabla `bets` con RLS + índice único para 1 apuesta activa
- Tipos ENUM
- Triggers de `updated_at`
- Políticas de seguridad

### 4. Configura Auth (email)

En Supabase → **Authentication → Providers**:
- Email está habilitado por defecto ✓
- Para desarrollo, deshabilita "Confirm email" en Authentication → Settings

### 5. Crear admin

Registra una cuenta normal, luego en SQL Editor:

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE username = 'tu_username';
```

---

## 📦 Estructura del proyecto

```
playfulbet/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/page.tsx    # Dashboard principal
│   │   ├── events/page.tsx       # Lista de eventos
│   │   ├── bets/page.tsx         # Historial apuestas
│   │   ├── leaderboard/page.tsx  # Clasificación
│   │   ├── profile/page.tsx      # Perfil usuario
│   │   └── admin/
│   │       ├── page.tsx          # Panel admin
│   │       └── events/
│   │           ├── new/page.tsx  # Crear evento
│   │           └── [id]/page.tsx # Editar/resolver evento
│   ├── components/
│   │   ├── ui/                   # Button, Input, Card, Badge, etc.
│   │   ├── layout/               # Navbar, Sidebar, BottomNav, AppLayout
│   │   ├── events/               # EventCard
│   │   └── bets/                 # BetCard, BetModal
│   ├── hooks/
│   │   ├── useProfile.ts
│   │   └── useActiveBet.ts
│   ├── lib/supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client + admin
│   ├── types/index.ts
│   ├── utils/index.ts
│   └── middleware.ts             # Auth + route protection
├── supabase/
│   └── schema.sql                # Schema completo
├── .env.local.example
└── vercel.json
```

---

## 🌐 Deploy en Vercel

1. Sube el código a GitHub
2. Ve a [vercel.com](https://vercel.com) → New Project → importa tu repo
3. En **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy ✓

Para el dominio de Supabase auth, añade tu URL de Vercel en:  
Supabase → **Authentication → URL Configuration → Site URL**

---

## 🎮 Funcionalidades

| Feature | Descripción |
|---------|-------------|
| 🔐 Auth | Email/password, sesión persistente |
| 💎 Puntos | Empieza con 1.000, se acumulan |
| 🎯 Apuestas | Solo 1 activa simultáneamente |
| ⚽ Eventos | Fútbol, tenis, baloncesto, etc. |
| 📊 Dashboard | Stats personales, apuesta activa |
| 🏆 Ranking | Clasificación global por puntos |
| 👤 Perfil | Historial, estadísticas detalladas |
| 👑 Admin | Crear eventos, resolver resultados |
| 📱 Responsive | Mobile-first, bottom nav en móvil |
| 🌑 Dark mode | Tema oscuro con acento verde |

---

## 🔒 Seguridad

- **RLS activado** en todas las tablas
- **1 apuesta activa** garantizada por índice único en PostgreSQL
- **Rutas admin** protegidas en middleware
- **Validación dual** frontend + backend
- **Service Role Key** solo en servidor

---

## 🛠️ Desarrollo

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Build de producción
npm run start    # Servir build de producción
npm run lint     # ESLint
```

---

## 📝 Añadir datos de prueba

En Supabase → SQL Editor:

```sql
INSERT INTO public.events (sport, competition, home_team, away_team, home_odds, draw_odds, away_odds, event_date, status)
VALUES
  ('football', 'LaLiga', 'Real Madrid', 'FC Barcelona', 2.10, 3.40, 3.50, NOW() + INTERVAL '2 days', 'pending'),
  ('tennis', 'Wimbledon', 'Carlos Alcaraz', 'Novak Djokovic', 1.75, NULL, 2.10, NOW() + INTERVAL '1 day', 'pending'),
  ('basketball', 'NBA Finals', 'Boston Celtics', 'Dallas Mavericks', 1.80, NULL, 2.05, NOW() + INTERVAL '3 days', 'pending');
```

---

Hecho con ❤️ usando Next.js 15 + Supabase
