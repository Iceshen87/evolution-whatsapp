import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import axios from 'axios'

interface User {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
  createdAt?: string
  lastLoginAt?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface LoginCredentials {
  username: string
  password: string
}

interface RegisterData {
  username: string
  email: string
  password: string
}

const API_URL = 'http://localhost:3001'
const AUTH_KEY = 'coc_auth_user'
const TOKEN_KEY = 'coc_access_token'
const REFRESH_TOKEN_KEY = 'coc_refresh_token'

const api = axios.create({
  baseURL: `${API_URL}/api`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let logoutFunc: (() => void) | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_INVALID' && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
          const { accessToken } = response.data
          localStorage.setItem(TOKEN_KEY, accessToken)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch {
        if (logoutFunc) {
          logoutFunc()
        }
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

const AuthContext = createContext<(AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}) | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false })
      return
    }

    try {
      const response = await api.get('/auth/me')
      setState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials)
    const { user, accessToken, refreshToken } = response.data
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    setState({ user, isAuthenticated: true, isLoading: false })
  }

  const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data)
    const { user, accessToken, refreshToken } = response.data
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    setState({ user, isAuthenticated: true, isLoading: false })
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(AUTH_KEY)
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }

  logoutFunc = logout

  const refreshUser = async () => {
    await loadUser()
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useUser() {
  const { user, isAuthenticated } = useAuth()
  return { user, isAuthenticated }
}

export { api }
export type { User, LoginCredentials, RegisterData }
