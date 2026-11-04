// Browser-only role simulation is opt-in and development-only. In production,
// the same VITE_DEMO_MODE flag only enables the public demo account picker;
// those accounts still authenticate against the API and write to PostgreSQL.
export const PUBLIC_DEMO_MODE = import.meta.env.PROD && import.meta.env.VITE_DEMO_MODE === 'true'
export const DEMO_MODE_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true'
export const DEMO_LOGIN_ENABLED = PUBLIC_DEMO_MODE || DEMO_MODE_ENABLED || (import.meta.env.DEV && import.meta.env.VITE_DEMO_ACCOUNTS === 'true')
export const DEMO_MODE_LABEL = DEMO_MODE_ENABLED ? 'Demo local' : 'Demo académica'

export const DEMO_ROLES = [
  'Administrador',
  'Adoptante',
  'Refugio',
  'Veterinario',
  'Hogar temporal',
]

// Public study accounts. The picker only fills the normal login form; it never
// authenticates or grants a role by itself. Do not reuse these passwords.
export const DEMO_ACCOUNTS = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_ACCOUNTS === 'true' ? {
  Administrador: { email: 'admin@petlink.test', password: 'AdminPetLink2026!' },
  Adoptante: { email: 'adoptante@petlink.test', password: 'AdoptantePetLink2026!' },
  Refugio: { email: 'refugio@petlink.test', password: 'RefugioPetLink2026!' },
  Veterinario: { email: 'veterinario@petlink.test', password: 'Veterinario2026!' },
  'Hogar temporal': { email: 'hogar@petlink.test', password: 'HogarTemporal2026!' },
} : {}
