import { useState, useEffect } from 'react'
import { AuthContext } from './contexts'
import { authService } from '../services/authService'

export function AuthProvider({ children }) {
  // Demo users directory
  const [users, setUsers] = useState(() => authService.getUsers())

  // Initial authentication state: ALWAYS logged out initially unless previously logged in
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return authService.getCurrentUser() !== null
  })

  // Currently authenticated student
  const [user, setUser] = useState(() => authService.getCurrentUser())

  // Keep state synced with localStorage
  useEffect(() => {
    if (isLoggedIn && user) {
      authService.updateProfile(user, {})
    }
  }, [isLoggedIn, user])

  // Login handler
  const login = (email, password) => {
    const res = authService.login(email, password)
    if (res.success) {
      setUser(res.user)
      setIsLoggedIn(true)
    }
    return res
  }

  // Quick 1-click login as demo account
  const loginAsDemo = (demoId = 0) => {
    const res = authService.loginAsDemo(demoId)
    if (res.success) {
      setUser(res.user)
      setIsLoggedIn(true)
    }
    return res
  }

  // Signup handler
  const signup = (name, email, password) => {
    const res = authService.signup(name, email, password)
    if (res.success) {
      setUser(res.user)
      setIsLoggedIn(true)
      if (res.users) setUsers(res.users)
    }
    return res
  }

  // Profile update handler
  const updateProfile = (updatedFields) => {
    if (!user) return false
    const res = authService.updateProfile(user, updatedFields)
    if (res.success) {
      setUser(res.user)
      if (res.users) setUsers(res.users)
      return true
    }
    return false
  }

  // Logout handler
  const logout = () => {
    authService.logout()
    setUser(null)
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        users,
        login,
        loginAsDemo,
        signup,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
