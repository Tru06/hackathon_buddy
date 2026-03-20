import { api } from './api'

export interface AuthResult {
  accessToken: string
  userId: string
}

export const authService = {
  register: (email: string, password: string) =>
    api.post<AuthResult>('/api/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResult>('/api/auth/login', { email, password }),

  refresh: () =>
    api.post<AuthResult>('/api/auth/refresh'),

  logout: () =>
    api.post<void>('/api/auth/logout'),
}
