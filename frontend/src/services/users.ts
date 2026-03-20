import { api } from './api'

export interface Profile {
  user_id: string
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

export interface ConnectionRequest {
  id: string
  from_user_id: string
  to_user_id: string
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  created_at: string
  display_name?: string
  avatar_url?: string
  skills?: string[]
}

export const usersService = {
  getProfile: (userId: string) =>
    api.get<Profile>(`/api/users/profile/${userId}`),

  updateProfile: (data: Partial<Profile>) =>
    api.put<Profile>('/api/users/profile', data),

  getConnections: () =>
    api.get<Profile[]>('/api/users/connections'),

  getPendingRequests: () =>
    api.get<ConnectionRequest[]>('/api/users/connections/pending'),

  sendConnectionRequest: (toUserId: string, message = '') =>
    api.post<ConnectionRequest>('/api/users/connections', { toUserId, message }),

  respondToRequest: (requestId: string, accept: boolean) =>
    api.patch<ConnectionRequest>(`/api/users/connections/${requestId}`, { accept }),
}
