import { api } from './api'

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
  created_at: string
}

export const hackathonsService = {
  list: (filters?: { theme?: string; location?: string }) => {
    const params = new URLSearchParams()
    if (filters?.theme) params.set('theme', filters.theme)
    if (filters?.location) params.set('location', filters.location)
    return api.get<Hackathon[]>(`/api/hackathons?${params}`)
  },

  get: (id: string) =>
    api.get<Hackathon>(`/api/hackathons/${id}`),

  registerInterest: (id: string) =>
    api.post<void>(`/api/hackathons/${id}/interest`),

  removeInterest: (id: string) =>
    api.delete<void>(`/api/hackathons/${id}/interest`),

  getParticipants: (id: string) =>
    api.get<unknown[]>(`/api/hackathons/${id}/participants`),
}
