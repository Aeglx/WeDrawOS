import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('sellerToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default instance