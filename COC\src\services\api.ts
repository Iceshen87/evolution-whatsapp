import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  if (config.url) {
    config.url = config.url.replace(/#/g, '%23')
  }
  return config
})

export default api
