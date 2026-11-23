import { apiRequest } from './apiClient.js'

export const reviewService = {
  /**
   * Submit feedback and rating after completing an exchange.
   */
  async submitReview(exchangeId, { rating, feedback }) {
    const res = await apiRequest(`/reviews/${exchangeId}`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, review: res.data }
  },

  /**
   * Fetch all reviews for a specific exchange.
   */
  async getExchangeReviews(exchangeId) {
    const res = await apiRequest(`/reviews/${exchangeId}`)
    if (!res.success) {
      return []
    }
    return res.data
  },

  /**
   * Fetch all reviews for a specific user.
   */
  async getUserReviews(userId) {
    const res = await apiRequest(`/reviews/users/${userId}`)
    if (!res.success) {
      return []
    }
    return res.data
  },
}
