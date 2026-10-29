import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('petlink_token')))

  useEffect(() => {
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
      try { await api.post('/auth/cerrar-sesion') } catch { /* The token may already be expired. */ }
      localStorage.removeItem('petlink_token')
      setUser(null)
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

