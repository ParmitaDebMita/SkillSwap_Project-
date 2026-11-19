import { safeGetStorage, safeSetStorage } from './apiClient.js'
import { students as initialStudents } from '../data/mockData.js'

export const studentService = {
  /**
   * Get all students directory
   * (Ready for FastAPI: GET /api/students)
   */
  getStudents() {
    const stored = safeGetStorage('skillswap_students', null)
    if (Array.isArray(stored) && stored.length > 0) {
      return stored
    }
    safeSetStorage('skillswap_students', initialStudents)
    return initialStudents
  },

  /**
   * Save updated students list
   */
  saveStudents(students) {
    safeSetStorage('skillswap_students', students)
    return students
  },
}
