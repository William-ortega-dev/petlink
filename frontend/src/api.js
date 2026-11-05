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
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.response?.status >= 500) return 'El servidor de PetLink tuvo un error. Prueba la vista demo local o revisa el backend y PostgreSQL.'
  if (!error?.response) return 'No hay conexión con el backend de PetLink. Inicia Laravel o usa una vista demo local.'
  return 'No fue posible completar la solicitud. Revisa los datos e intenta de nuevo.'
}

export default api

