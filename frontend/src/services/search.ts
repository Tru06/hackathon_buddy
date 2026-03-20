import { api } from './api'
import type { Profile } from './users'

export interface ScoredProfile extends Profile {
  score: number
}

export interface SearchResult {
  items: ScoredProfile[]
  total: number
}

export interface SearchFilters {
  skills?: string
  interests?: string
  availability?: string
  hackathonId?: string
  excludeTeamed?: boolean
  timezone?: string
  page?: number
  pageSize?: number
}

export const searchService = {
  searchUsers: (filters: SearchFilters) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    return api.get<SearchResult>(`/api/search/users?${params}`)
  },

  getSuggestions: (hackathonId: string) =>
    api.get<ScoredProfile[]>(`/api/search/suggest?hackathonId=${hackathonId}`),

  getMatchScore: (userA: string, userB: string) =>
    api.get<{ score: number }>(`/api/search/score?userA=${userA}&userB=${userB}`),
}
