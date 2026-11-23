import { apiRequest } from './apiClient.js'

export const chatService = {
  /**
   * Retrieve message history for an accepted exchange.
   */
  async getMessages(exchangeId) {
    const res = await apiRequest(`/chat/${exchangeId}/messages`)
    if (!res.success) {
      return { success: false, error: res.error, messages: [] }
    }
    return { success: true, messages: res.data }
  },

  /**
   * Send a message inside an accepted exchange.
   */
  async sendMessage(exchangeId, text) {
    const res = await apiRequest(`/chat/${exchangeId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })

    if (!res.success) {
      return { success: false, error: res.error }
    }
    return { success: true, message: res.data }
  },
}
