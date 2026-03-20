import { api } from './api'

export interface Notification {
  id: string
  user_id: string
  type: string
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

export const notificationsService = {
  getAll: (page = 1, pageSize = 20) =>
    api.get<{ items: Notification[]; total: number }>(`/api/notifications?page=${page}&pageSize=${pageSize}`),

  getUnread: () =>
    api.get<Notification[]>('/api/notifications/unread'),

  markRead: (id: string) =>
    api.patch<void>(`/api/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<void>('/api/notifications/read-all'),
}
