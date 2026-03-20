import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authService } from '../services/auth'
import { setAccessToken } from '../services/api'

interface AuthState {
  userId: string | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ userId: null, loading: true })

  // Try silent refresh on mount
  useEffect(() => {
    authService.refresh()
      .then(data => {
        setAccessToken(data.accessToken)
        setState({ userId: data.userId, loading: false })
      })
      .catch(() => setState({ userId: null, loading: false }))
  }, [])

  async function login(email: string, password: string) {
    const data = await authService.login(email, password)
    setAccessToken(data.accessToken)
    setState({ userId: data.userId, loading: false })
  }

  async function register(email: string, password: string) {
    const data = await authService.register(email, password)
    setAccessToken(data.accessToken)
    setState({ userId: data.userId, loading: false })
  }

  async function logout() {
    await authService.logout().catch(() => {})
    setAccessToken(null)
    setState({ userId: null, loading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
