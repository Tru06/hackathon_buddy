"use client"

import { useState, useEffect, useCallback } from "react"
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshToken,
  getUserProfile,
  setAccessToken,
  type User,
} from "@/lib/api"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  // On mount: try silent refresh via httpOnly cookie, then load profile
  useEffect(() => {
    const userId = localStorage.getItem("user_id")

    refreshToken()
      .then(async (data) => {
        const id = data.userId || userId
        if (id) {
          const profile = await getUserProfile(id).catch(() => null)
          setUser(profile ?? ({ id } as User))
        }
      })
      .catch(() => {
        setAccessToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiLogin(email, password)
      // Load full profile after login
      const profile = await getUserProfile(response.user.id).catch(() => response.user)
      setUser(profile)
      return response
    } catch (err: any) {
      const message = err?.error ?? err?.message ?? "Login failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiRegister(email, password)
      setUser(response.user)
      return response
    } catch (err: any) {
      const message = err?.error ?? err?.message ?? "Registration failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await apiLogout()
    } catch {
      // ignore
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  return { user, isAuthenticated, isLoading, error, login, register, logout }
}
