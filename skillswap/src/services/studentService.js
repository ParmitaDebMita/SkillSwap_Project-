/**
 * SkillSwap Student Service — Real FastAPI Backend
 *
 * GET /api/students?search=&category=&page=1&limit=50
 */

import { apiRequest } from './apiClient.js'

export const studentService = {
  /**
   * Fetch students from the backend with optional search/filter params.
   * Returns an array of student objects (no password field).
   */
  async getStudents({ search = '', category = '', page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category && category !== 'All') params.set('category', category)
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await apiRequest(`/students?${params.toString()}`)
    if (!res.success) {
      console.error('[studentService] Failed to fetch students:', res.error)
      return []
    }
    return res.data
  },
}
