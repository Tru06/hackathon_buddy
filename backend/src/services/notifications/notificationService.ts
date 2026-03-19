import pool from '../../db/client'

export type NotificationType =
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'TEAM_INVITE'
  | 'TEAM_INVITE_ACCEPTED'
  | 'TEAM_INVITE_DECLINED'
  | 'TEAM_MESSAGE'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

/**
 * Create and persist an in-app notification for a user.
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
): Promise<Notification> {
  const result = await pool.query<Notification>(
    `INSERT INTO notifications (user_id, type, payload)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, type, JSON.stringify(payload)],
  )
  return result.rows[0]
}

/**
 * Get all unread notifications for a user, newest first.
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const result = await pool.query<Notification>(
    `SELECT * FROM notifications
     WHERE user_id = $1 AND read = FALSE
     ORDER BY created_at DESC`,
    [userId],
  )
  return result.rows
}

/**
 * Get all notifications for a user (paginated), newest first.
 */
export async function getNotifications(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ items: Notification[]; total: number }> {
  const offset = (page - 1) * pageSize
  const [countRes, itemsRes] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [userId]),
    pool.query<Notification>(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset],
    ),
  ])
  return { items: itemsRes.rows, total: parseInt(countRes.rows[0].count, 10) }
}

/**
 * Mark a single notification as read. Only the owning user may do this.
 */
export async function markRead(notificationId: string, userId: string): Promise<void> {
  const result = await pool.query(
    `UPDATE notifications SET read = TRUE
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId],
  )
  if (result.rowCount === 0) {
    const err = new Error('Notification not found.') as Error & { status: number }
    err.status = 404
    throw err
  }
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllRead(userId: string): Promise<void> {
  await pool.query(
    'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
    [userId],
  )
}
