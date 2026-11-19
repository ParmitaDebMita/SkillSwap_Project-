import { safeGetStorage, safeSetStorage } from './apiClient.js'
import { currentUser as defaultAlex, students as defaultStudents } from '../data/mockData.js'

const initialDemoUsers = [defaultAlex, ...defaultStudents]

export const authService = {
  /**
   * Get all registered users from storage (or seed default demo users)
   */
  getUsers() {
    const stored = safeGetStorage('skillswap_users', null)
    if (Array.isArray(stored) && stored.length > 0) {
      return stored
    }
    safeSetStorage('skillswap_users', initialDemoUsers)
    return initialDemoUsers
  },

  /**
   * Get currently active session user
   */
  getCurrentUser() {
    const isLoggedIn = safeGetStorage('skillswap_is_logged_in', false)
    if (!isLoggedIn) return null
    return safeGetStorage('skillswap_current_user', null)
  },

  /**
   * Login with email and password
   * (Ready for FastAPI: POST /api/auth/login)
   */
  login(email, password) {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()
    const users = this.getUsers()

    const found = users.find(u => u.email.toLowerCase() === cleanEmail)
    if (!found) {
      return {
        success: false,
        message: 'No account found with this email. Please check your email or sign up.',
      }
    }

    if (found.password && cleanPassword !== found.password) {
      return {
        success: false,
        message: 'Incorrect password. (Hint: Demo password is "password123")',
      }
    }

    safeSetStorage('skillswap_is_logged_in', true)
    safeSetStorage('skillswap_current_user', found)
    return { success: true, user: found }
  },

  /**
   * Quick 1-click Demo Login
   */
  loginAsDemo(demoId = 0) {
    const users = this.getUsers()
    const target = users.find(u => u.id === demoId) || users[0]
    if (target) {
      safeSetStorage('skillswap_is_logged_in', true)
      safeSetStorage('skillswap_current_user', target)
      return { success: true, user: target }
    }
    return { success: false, message: 'Demo profile not found.' }
  },

  /**
   * Register a new student account
   * (Ready for FastAPI: POST /api/auth/signup)
   */
  signup(name, email, password) {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()
    const users = this.getUsers()

    const exists = users.some(u => u.email.toLowerCase() === cleanEmail)
    if (exists) {
      return {
        success: false,
        message: 'An account with this email already exists. Please log in instead.',
      }
    }

    const newUser = {
      id: Date.now(),
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      avatar: '🎓',
      bio: `Hello! I am ${cleanName}, a student on SkillSwap excited to learn and share skills.`,
      university: 'Campus Student',
      skillsOffered: ['JavaScript', 'Web Basics'],
      skillsWanted: ['Python', 'Graphic Design'],
      category: 'Technology',
      rating: 5.0,
      exchanges: 0,
    }

    const updatedUsers = [newUser, ...users]
    safeSetStorage('skillswap_users', updatedUsers)
    safeSetStorage('skillswap_is_logged_in', true)
    safeSetStorage('skillswap_current_user', newUser)

    return { success: true, user: newUser, users: updatedUsers }
  },

  /**
   * Update student profile fields
   * (Ready for FastAPI: PUT /api/users/profile)
   */
  updateProfile(currentUser, updatedFields) {
    if (!currentUser) return false

    const updatedUser = {
      ...currentUser,
      ...updatedFields,
    }

    const users = this.getUsers()
    const nextUsers = users.map(u => (u.id === updatedUser.id ? updatedUser : u))

    safeSetStorage('skillswap_current_user', updatedUser)
    safeSetStorage('skillswap_users', nextUsers)

    return { success: true, user: updatedUser, users: nextUsers }
  },

  /**
   * Terminate current session
   * (Ready for FastAPI: POST /api/auth/logout)
   */
  logout() {
    safeSetStorage('skillswap_is_logged_in', false)
    try {
      localStorage.removeItem('skillswap_current_user')
    } catch {
      // ignore
    }
    return true
  },
}
