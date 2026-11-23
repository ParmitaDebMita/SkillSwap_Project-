/**
 * SkillSwap Exchange Service — Real FastAPI Backend
 *
 * GET   /api/exchanges              → array of exchange objects (sent + received)
 * POST  /api/exchanges              → { toId, skillOffered, skillWanted, message }
 * PATCH /api/exchanges/{id}/status  → { status: "accepted" | "rejected" }
 */

import { apiRequest } from './apiClient.js'

export const exchangeService = {
  /**
   * Fetch all exchanges for the current user (sent + received).
   */
  async getRequests() {
    const res = await apiRequest('/exchanges')
    if (!res.success) {
      console.error('[exchangeService] Failed to fetch exchanges:', res.error)
      return []
    }
    return res.data
  },

  /**
   * Send a new exchange request.
   * @param {string} toId - target student's id
   * @param {string} skillOffered
   * @param {string} skillWanted
   * @param {string} message
   */
  async createRequest(toId, skillOffered, skillWanted, message = '') {
    const res = await apiRequest('/exchanges', {
      method: 'POST',
      body: JSON.stringify({ toId, skillOffered, skillWanted, message }),
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, request: res.data }
  },

  /**
   * Accept, reject, or mark an exchange as completed.
   */
  async updateStatus(requestId, newStatus) {
    const res = await apiRequest(`/exchanges/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, updatedRequest: res.data }
  },

  /**
   * Schedule or reschedule a session inside an accepted exchange.
   */
  async scheduleSession(requestId, { date, time, note = '' }) {
    const res = await apiRequest(`/exchanges/${requestId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ date, time, note }),
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, updatedRequest: res.data }
  },

  /**
   * Cancel a scheduled session.
   */
  async cancelSession(requestId) {
    const res = await apiRequest(`/exchanges/${requestId}/schedule/cancel`, {
      method: 'POST',
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, updatedRequest: res.data }
  },
}
