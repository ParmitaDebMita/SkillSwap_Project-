import { safeGetStorage, safeSetStorage } from './apiClient.js'
import { initialRequests } from '../data/mockData.js'

export const exchangeService = {
  /**
   * Get all exchange proposals
   * (Ready for FastAPI: GET /api/exchanges)
   */
  getRequests() {
    const stored = safeGetStorage('skillswap_requests', null)
    if (Array.isArray(stored)) {
      return stored
    }
    safeSetStorage('skillswap_requests', initialRequests)
    return initialRequests
  },

  /**
   * Submit a new exchange request
   * (Ready for FastAPI: POST /api/exchanges)
   */
  createRequest(currentUser, targetStudent, skillOffered, skillWanted, message = '') {
    if (!currentUser) {
      return { success: false, error: 'You must be logged in to send a request.' }
    }

    if (currentUser.id === targetStudent.id) {
      return { success: false, error: 'You cannot send an exchange request to yourself.' }
    }

    const currentRequests = this.getRequests()

    // Prevent duplicate pending requests between same pair
    const duplicate = currentRequests.some(r => {
      const senderId = r.fromId !== undefined ? r.fromId : r.from?.id
      const receiverId = r.toId !== undefined ? r.toId : r.to?.id
      const isSamePair =
        (senderId === currentUser.id && receiverId === targetStudent.id) ||
        (senderId === targetStudent.id && receiverId === currentUser.id)
      return isSamePair && r.status === 'pending'
    })

    if (duplicate) {
      return {
        success: false,
        error: 'A pending exchange request already exists between you and this student.',
      }
    }

    const newRequest = {
      id: Date.now(),
      fromId: currentUser.id,
      toId: targetStudent.id,
      from: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        university: currentUser.university,
        email: currentUser.email,
      },
      to: {
        id: targetStudent.id,
        name: targetStudent.name,
        avatar: targetStudent.avatar,
        university: targetStudent.university,
        email: targetStudent.email,
      },
      skillOffered,
      skillWanted,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      message:
        message.trim() ||
        `Hi ${targetStudent.name}! I would love to exchange ${skillOffered} for ${skillWanted}. Let's learn together!`,
    }

    const updated = [newRequest, ...currentRequests]
    safeSetStorage('skillswap_requests', updated)
    return { success: true, request: newRequest, requests: updated }
  },

  /**
   * Update request status (accept or reject)
   * (Ready for FastAPI: PATCH /api/exchanges/{id}/status)
   */
  updateStatus(requestId, newStatus) {
    const currentRequests = this.getRequests()
    let targetRequest = null

    const updated = currentRequests.map(r => {
      if (r.id === requestId) {
        targetRequest = { ...r, status: newStatus }
        return targetRequest
      }
      return r
    })

    safeSetStorage('skillswap_requests', updated)
    return { success: true, requests: updated, updatedRequest: targetRequest }
  },
}
