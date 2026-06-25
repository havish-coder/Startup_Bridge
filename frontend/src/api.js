import axios from 'axios'

// In dev, requests go to /api/* and Vite's dev proxy (vite.config.js) forwards
// them to the Express backend on http://localhost:4000.
// In production (e.g. Render static site), set VITE_API_URL at build time to the
// backend's public URL + /api, e.g. https://startupbridge-backend.onrender.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Request interceptor — attach the JWT to every request if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
