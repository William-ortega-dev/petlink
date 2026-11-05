import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from './api'
import { DEMO_MODE_ENABLED } from './demoMode'

const AuthContext = createContext(null)

const DEMO_USERS = {
  Administrador: { id: 'demo-admin', name: 'Administración PetLink', email: 'admin@petlink.test', role: { id: 1, nombre: 'Administrador' }, isDemo: true },
  Adoptante: { id: 'demo-adopter', name: 'Adoptante Demo', email: 'adoptante@petlink.test', role: { id: 2, nombre: 'Adoptante' }, isDemo: true },
  Refugio: { id: 'demo-shelter', name: 'Refugio Patitas Bogotá', email: 'refugio@petlink.test', role: { id: 3, nombre: 'Refugio' }, isDemo: true },
  Veterinario: { id: 'demo-vet', name: 'Veterinaria Demo', email: 'veterinario@petlink.test', role: { id: 4, nombre: 'Veterinario' }, isDemo: true },
  'Hogar temporal': { id: 'demo-foster', name: 'Hogar Demo', email: 'hogar@petlink.test', role: { id: 5, nombre: 'Hogar temporal' }, isDemo: true },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!DEMO_MODE_ENABLED) return null
    const role = localStorage.getItem('petlink_demo_role')
    return DEMO_USERS[role] || null
  })
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('petlink_token') && !(DEMO_MODE_ENABLED && localStorage.getItem('petlink_demo_role'))))

  useEffect(() => {
    if (!DEMO_MODE_ENABLED) localStorage.removeItem('petlink_demo_role')
    const demoRole = DEMO_MODE_ENABLED ? localStorage.getItem('petlink_demo_role') : null
    if (demoRole && DEMO_USERS[demoRole]) {
      localStorage.removeItem('petlink_token')
      setUser(DEMO_USERS[demoRole])
      setLoading(false)
      return
    }
    if (!localStorage.getItem('petlink_token')) return
    api.get('/auth/usuario')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('petlink_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const saveSession = (data) => {
    localStorage.removeItem('petlink_demo_role')
    localStorage.setItem('petlink_token', data.token)
    setUser(data.user)
  }

  const value = useMemo(() => ({
    user,
    loading,
    login: async (credentials) => {
      const { data } = await api.post('/auth/iniciar-sesion', credentials)
      saveSession(data)
      return data.user
    },
    loginDemo: async (role) => {
      if (!DEMO_MODE_ENABLED || !DEMO_USERS[role]) throw new Error('La vista demo no está habilitada en este entorno.')
      const demoUser = DEMO_USERS[role]
      localStorage.removeItem('petlink_token')
      localStorage.setItem('petlink_demo_role', role)
      setUser(demoUser)
      return demoUser
    },
    register: async (fields) => {
      const { data } = await api.post('/auth/registro', fields)
      saveSession(data)
      return data.user
    },
    refreshUser: async () => {
      const { data } = await api.get('/auth/usuario')
      setUser(data.user)
      return data.user
    },
    logout: async () => {
      if (!user?.isDemo) {
        try { await api.post('/auth/cerrar-sesion') } catch { /* The token may already be expired. */ }
      }
      localStorage.removeItem('petlink_token')
      localStorage.removeItem('petlink_demo_role')
      setUser(null)
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

