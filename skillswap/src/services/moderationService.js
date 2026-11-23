import { apiRequest } from './apiClient.js'

export const moderationService = {
  /**
   * Report inappropriate behaviour.
   */
  async reportUser({ reportedUserId, reason, details = '' }) {
    const res = await apiRequest('/moderation/report', {
      method: 'POST',
      body: JSON.stringify({ reportedUserId, reason, details }),
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, message: res.data.message }
  },

  /**
   * Block a user.
   */
  async blockUser(blockedUserId) {
    const res = await apiRequest('/moderation/block', {
      method: 'POST',
      body: JSON.stringify({ blockedUserId }),
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, message: res.data.message }
  },

  /**
   * Unblock a user.
   */
  async unblockUser(blockedUserId) {
    const res = await apiRequest('/moderation/unblock', {
      method: 'POST',
      body: JSON.stringify({ blockedUserId }),
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, message: res.data.message }
  },

  /**
   * Get the list of users blocked by the current user (with names/avatars).
   */
  async getBlockedUsers() {
    const res = await apiRequest('/moderation/blocked')
    if (!res.success) return []
    return res.data.blockedUsers || []
  },
}
