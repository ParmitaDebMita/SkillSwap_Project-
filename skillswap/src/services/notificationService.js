import { apiRequest } from './apiClient.js'

export const notificationService = {
  /**
   * Fetch current user's notifications.
   */
  async getNotifications() {
    const res = await apiRequest('/notifications')
    if (!res.success) {
      return []
    }
    return res.data
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId) {
    const res = await apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    })
    return res.success
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead() {
    const res = await apiRequest('/notifications/read-all', {
      method: 'PATCH',
    })
    return res.success
  },
}
