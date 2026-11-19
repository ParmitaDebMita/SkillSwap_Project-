/**
 * SkillSwap Auth Service — Real FastAPI Backend
 *
 * Replaces localStorage demo mode with real API calls.
 * Endpoints:
 *   POST /api/auth/signup  → { token, user }
 *   POST /api/auth/login   → { token, user }
 *   GET  /api/auth/me      → user object
 *   PUT  /api/users/profile → updated user object
 */

import { apiRequest, setToken, clearToken, safeGetStorage, safeSetStorage, safeRemoveStorage } from './apiClient.js'

// ── Session persistence helpers ───────────────────────────────────────────────

function persistUser(user) {
  safeSetStorage('skillswap_current_user', user)
  safeSetStorage('skillswap_is_logged_in', true)
}

function clearSession() {
  clearToken()
  safeRemoveStorage('skillswap_current_user')
  safeSetStorage('skillswap_is_logged_in', false)
}

function getCachedUser() {
  const isLoggedIn = safeGetStorage('skillswap_is_logged_in', false)
  if (!isLoggedIn) return null
  return safeGetStorage('skillswap_current_user', null)
}

// ── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Returns the cached user from the previous session (synchronous, for initial render).
   * The real session is validated via GET /api/auth/me on mount.
   */
  getCurrentUser() {
    return getCachedUser()
  },

  /**
   * POST /api/auth/login → { token, user }
   */
  async login(email, password) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })

    if (!res.success) {
      return { success: false, message: res.error }
    }

    const { token, user } = res.data
    setToken(token)
    persistUser(user)
    return { success: true, user }
  },

  /**
   * POST /api/auth/signup → { token, user }
   */
  async signup(name, email, password) {
    const res = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
    })

    if (!res.success) {
      return { success: false, message: res.error }
    }

    const { token, user } = res.data
    setToken(token)
    persistUser(user)
    return { success: true, user }
  },

  /**
   * GET /api/auth/me — validates current token and refreshes user data.
   */
  async fetchCurrentUser() {
    const res = await apiRequest('/auth/me')
    if (!res.success) {
      clearSession()
      return null
    }
    persistUser(res.data)
    return res.data
  },

  /**
   * PUT /api/users/profile → updated user object
   */
  async updateProfile(updatedFields) {
    const res = await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updatedFields),
    })

    if (!res.success) {
      return { success: false, message: res.error }
    }

    persistUser(res.data)
    return { success: true, user: res.data }
  },

  /**
   * Clear session — no backend call needed (JWT is stateless).
   */
  logout() {
    clearSession()
    return true
  },
}
