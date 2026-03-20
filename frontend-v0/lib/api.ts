// API utility for connecting to the Hackathon Buddy backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// ============================================
// Types
// ============================================

export interface User {
  id: string
  email: string
  display_name: string
  bio: string
  skills: string[]
  interests: string[]
  experience_level: string
  availability: string
  timezone: string
  avatar_url: string
  github_url: string
  linkedin_url: string
  portfolio_url: string
}

export interface Hackathon {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  theme: string
  location: string
  max_team_size: number
  registration_url: string
  prize?: string
  participants?: number
  status?: string
}

export interface Team {
  id: string
  name: string
  description: string
  hackathon_id: string
  created_by: string
  max_members: number
  required_skills: string[]
  is_open: boolean
  members: TeamMember[]
  member_count?: number
}

export interface TeamMember {
  user_id: string
  team_id: string
  role: "owner" | "member"
  display_name: string
  avatar_url: string
  skills: string[]
}

export interface Message {
  id: string
  content: string
  user_id: string
  display_name?: string
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  hackathon_id: string
  title: string
  description: string
  repository_url: string
  demo_url: string
}

export interface MyTeam {
  id: string
  name: string
  description: string
  hackathon_id: string
  hackathon_name: string
  member_count: number
  role: "owner" | "member"
}

export interface PendingInvite {
  id: string
  team_id: string
  team_name: string
  inviter_name: string
  created_at: string
}

// ============================================
// Token storage (access token only — refresh token is httpOnly cookie)
// ============================================

let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
  if (token) {
    localStorage.setItem("access_token", token)
  } else {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_id")
  }
}

export function getStoredAccessToken(): string | null {
  if (_accessToken) return _accessToken
  return localStorage.getItem("access_token")
}

// ============================================
// API Request Helper
// ============================================

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAccessToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // send httpOnly refresh token cookie
  })

  // Try silent token refresh on 401
  if (res.status === 401 && endpoint !== "/api/auth/refresh") {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setAccessToken(data.accessToken)
        headers["Authorization"] = `Bearer ${data.accessToken}`
        const retry = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: "include",
        })
        if (!retry.ok) throw await retry.json()
        return retry.json()
      }
    } catch {
      setAccessToken(null)
    }
    throw { status: 401, error: "Unauthorized" }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw err
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ============================================
// Health Check
// ============================================

export async function checkHealth() {
  return request<{ status: string }>("/health")
}

// ============================================
// Authentication
// ============================================

export async function register(email: string, password: string) {
  const data = await request<{ accessToken: string; userId: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  setAccessToken(data.accessToken)
  localStorage.setItem("user_id", data.userId)
  // Return shape the use-auth hook expects
  return {
    token: data.accessToken,
    user: { id: data.userId, email } as User,
  }
}

export async function login(email: string, password: string) {
  const data = await request<{ accessToken: string; userId: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  setAccessToken(data.accessToken)
  localStorage.setItem("user_id", data.userId)
  return {
    token: data.accessToken,
    user: { id: data.userId, email } as User,
  }
}

export async function refreshToken() {
  const data = await request<{ accessToken: string; userId: string }>("/api/auth/refresh", {
    method: "POST",
  })
  setAccessToken(data.accessToken)
  localStorage.setItem("user_id", data.userId)
  return data
}

export async function logout() {
  await request("/api/auth/logout", { method: "POST" }).catch(() => {})
  setAccessToken(null)
}

// ============================================
// User Profiles
// ============================================

export async function getUserProfile(userId: string) {
  return request<User>(`/api/users/profile/${userId}`)
}

export async function updateUserProfile(data: Partial<User>) {
  return request<User>("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function getConnections() {
  return request<User[]>("/api/users/connections")
}

export async function sendConnectionRequest(toUserId: string, message = "") {
  return request("/api/users/connections", {
    method: "POST",
    body: JSON.stringify({ toUserId, message }),
  })
}

export async function respondToConnectionRequest(requestId: string, accept: boolean) {
  return request(`/api/users/connections/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ accept }),
  })
}

export interface PendingConnectionRequest {
  id: string
  from_user_id: string
  message: string
  display_name?: string
  avatar_url?: string
}

export async function getPendingConnections() {
  return request<PendingConnectionRequest[]>("/api/users/connections/pending")
}

// ============================================
// Search & Match
// ============================================

export async function findMatchingUsers(filters: {
  skills?: string
  interests?: string
  availability?: string
  hackathonId?: string
  excludeTeamed?: boolean
  page?: number
  pageSize?: number
}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v))
  })
  return request<{ items: User[]; total: number }>(`/api/search/users?${params}`)
}

export async function getSuggestedTeammates(hackathonId: string) {
  return request<User[]>(`/api/search/suggest?hackathonId=${hackathonId}`)
}

// ============================================
// Hackathons
// ============================================

export async function getHackathons(filters?: { theme?: string; location?: string }) {
  const params = new URLSearchParams()
  if (filters?.theme) params.set("theme", filters.theme)
  if (filters?.location) params.set("location", filters.location)
  return request<Hackathon[]>(`/api/hackathons?${params}`)
}

export async function getHackathonById(id: string) {
  return request<Hackathon>(`/api/hackathons/${id}`)
}

export async function createHackathon(data: Partial<Hackathon>) {
  return request<Hackathon>("/api/hackathons", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function registerInterest(hackathonId: string) {
  return request(`/api/hackathons/${hackathonId}/interest`, { method: "POST" })
}

export async function removeInterest(hackathonId: string) {
  return request(`/api/hackathons/${hackathonId}/interest`, { method: "DELETE" })
}

// ============================================
// Teams
// ============================================

export async function getTeams(hackathonId: string) {
  return request<Team[]>(`/api/teams?hackathonId=${hackathonId}`)
}

export async function getTeam(teamId: string) {
  return request<Team>(`/api/teams/${teamId}`)
}

export async function createTeam(data: Partial<Team>) {
  return request<Team>("/api/teams", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateTeam(teamId: string, data: Partial<Team>) {
  return request<Team>(`/api/teams/${teamId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function inviteMember(teamId: string, inviteeId: string) {
  return request(`/api/teams/${teamId}/invite`, {
    method: "POST",
    body: JSON.stringify({ inviteeId }),
  })
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  return request(`/api/teams/invites/${inviteId}`, {
    method: "PATCH",
    body: JSON.stringify({ accept }),
  })
}

export async function leaveTeam(teamId: string) {
  return request(`/api/teams/${teamId}/leave`, { method: "DELETE" })
}

export async function getMyTeams() {
  return request<MyTeam[]>("/api/teams/mine")
}

export async function getPendingInvites() {
  return request<PendingInvite[]>("/api/teams/invites/pending")
}

// ============================================
// Team Chat & Projects
// ============================================

export async function getTeamMessages(teamId: string) {
  return request<Message[]>(`/api/teams/${teamId}/messages`)
}

export async function sendTeamMessage(teamId: string, content: string) {
  return request<Message>(`/api/teams/${teamId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
}

export async function submitProject(teamId: string, data: Partial<Project>) {
  return request<Project>(`/api/teams/${teamId}/projects`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================
// Notifications
// ============================================

export async function getNotifications(page = 1, pageSize = 20) {
  return request<{ items: unknown[]; total: number }>(
    `/api/notifications?page=${page}&pageSize=${pageSize}`
  )
}

export async function getUnreadNotifications() {
  return request<unknown[]>("/api/notifications/unread")
}

export async function markNotificationRead(id: string) {
  return request(`/api/notifications/${id}/read`, { method: "PATCH" })
}

export async function markAllNotificationsRead() {
  return request("/api/notifications/read-all", { method: "PATCH" })
}

export function isDemoMode() {
  return false
}
