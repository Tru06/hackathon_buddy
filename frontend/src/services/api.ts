const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // send httpOnly refresh token cookie
  })

  if (res.status === 401 && path !== '/api/auth/refresh') {
    // Try silent refresh
    try {
      const refreshed = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (refreshed.ok) {
        const data = await refreshed.json()
        setAccessToken(data.accessToken)
        headers['Authorization'] = `Bearer ${data.accessToken}`
        const retry = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers,
          credentials: 'include',
        })
        if (!retry.ok) throw await retry.json()
        return retry.json()
      }
    } catch {
      setAccessToken(null)
    }
    throw { status: 401, error: 'Unauthorized' }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw { status: res.status, ...err }
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
