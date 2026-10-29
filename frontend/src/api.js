import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('petlink_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

export function messageFromError(error) {
  const errors = error?.response?.data?.errors
  if (errors) return Object.values(errors).flat().join(' ')
  return error?.response?.data?.message || 'No fue posible conectar con PetLink. Intenta de nuevo.'
}

export default api

