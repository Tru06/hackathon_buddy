import { api } from './api'

export interface Team {
  id: string
  name: string
  description: string
  hackathon_id: string
  created_by: string
  max_members: number
  required_skills: string[]
  is_open: boolean
  created_at: string
  members?: TeamMember[]
  member_count?: number
}

export interface TeamMember {
  user_id: string
  team_id: string
  role: 'owner' | 'member'
  display_name: string
  avatar_url: string
  skills: string[]
}

export interface TeamInvite {
  id: string
  team_id: string
  inviter_id: string
  invitee_id: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  created_at: string
}

export const teamsService = {
  create: (data: Partial<Team>) =>
    api.post<Team>('/api/teams', data),

  get: (id: string) =>
    api.get<Team>(`/api/teams/${id}`),

  listByHackathon: (hackathonId: string) =>
    api.get<Team[]>(`/api/teams?hackathonId=${hackathonId}`),

  update: (id: string, data: Partial<Team>) =>
    api.patch<Team>(`/api/teams/${id}`, data),

  invite: (teamId: string, inviteeId: string) =>
    api.post<TeamInvite>(`/api/teams/${teamId}/invite`, { inviteeId }),

  respondToInvite: (inviteId: string, accept: boolean) =>
    api.patch<Team>(`/api/teams/invites/${inviteId}`, { accept }),

  leave: (teamId: string) =>
    api.delete<void>(`/api/teams/${teamId}/leave`),

  getMessages: (teamId: string) =>
    api.get<unknown[]>(`/api/teams/${teamId}/messages`),

  sendMessage: (teamId: string, content: string) =>
    api.post<unknown>(`/api/teams/${teamId}/messages`, { content }),
}
