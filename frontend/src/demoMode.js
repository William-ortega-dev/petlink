export const PUBLIC_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
export const DEMO_MODE_ENABLED = import.meta.env.DEV || PUBLIC_DEMO_MODE
export const DEMO_MODE_LABEL = PUBLIC_DEMO_MODE ? 'Demo académica' : 'Demo local'

export const DEMO_ROLES = [
  'Administrador',
  'Adoptante',
  'Refugio',
  'Veterinario',
  'Hogar temporal',
]
