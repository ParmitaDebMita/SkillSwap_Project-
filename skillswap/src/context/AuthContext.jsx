import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from './contexts'
import { authService } from '../services/authService'

export function AuthProvider({ children }) {
  // Seed from cache for instant first render (avoids flash of logged-out state)
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.getCurrentUser() !== null)
  const [authLoading, setAuthLoading] = useState(true) // true while we verify token with backend

  // ── On mount: validate cached token with GET /api/auth/me ────────────────
  useEffect(() => {
    let cancelled = false

    async function verifySession() {
      const cached = authService.getCurrentUser()
      if (!cached) {
        // Not logged in — nothing to verify
        setAuthLoading(false)
        return
      }

      const freshUser = await authService.fetchCurrentUser()
      if (!cancelled) {
        if (freshUser) {
          setUser(freshUser)
          setIsLoggedIn(true)
        } else {
          // Token expired or invalid — log out silently
          setUser(null)
          setIsLoggedIn(false)
        }
        setAuthLoading(false)
      }
    }

    verifySession()
    return () => { cancelled = true }
  }, [])

  // ── Login: POST /api/auth/login ──────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password)
    if (res.success) {
      setUser(res.user)
      setIsLoggedIn(true)
    }
    return res
  }, [])

  // ── Signup: POST /api/auth/signup ────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    const res = await authService.signup(name, email, password)
    if (res.success) {
      setUser(res.user)
      setIsLoggedIn(true)
    }
    return res
  }, [])

  // ── Profile update: PUT /api/users/profile ───────────────────────────────
  const updateProfile = useCallback(async (updatedFields) => {
    const res = await authService.updateProfile(updatedFields)
    if (res.success) {
      setUser(res.user)
      return true
    }
    return false
  }, [])

  // ── Refresh user: GET /api/auth/me ────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const freshUser = await authService.fetchCurrentUser()
    if (freshUser) {
      setUser(freshUser)
      return freshUser
    }
    return null
  }, [])

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setIsLoggedIn(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        authLoading,
        login,
        signup,
        updateProfile,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
