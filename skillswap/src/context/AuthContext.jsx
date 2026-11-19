import { createContext, useContext, useState, useEffect } from 'react'
import { currentUser as initialAlex, students as initialStudents } from '../data/mockData'

const AuthContext = createContext()

function safeGetStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined || raw === 'undefined') return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.warn(`[SkillSwap Storage] Error reading ${key}:`, err)
    return fallback
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[SkillSwap Storage] Error saving ${key}:`, err)
  }
}

// Initial demo user pool containing Alex Johnson and mock student profiles
const initialDemoUsers = [initialAlex, ...initialStudents]

export function AuthProvider({ children }) {
  // Demo users repository in localStorage
  const [users, setUsers] = useState(() => {
    const stored = safeGetStorage('skillswap_users', null)
    if (Array.isArray(stored) && stored.length > 0) {
      return stored
    }
    safeSetStorage('skillswap_users', initialDemoUsers)
    return initialDemoUsers
  })

  // Initial authentication state: ALWAYS logged out initially unless explicitly logged in previously
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const storedAuth = safeGetStorage('skillswap_is_logged_in', false)
    return storedAuth === true
  })

  // Currently authenticated user (null when logged out)
  const [user, setUser] = useState(() => {
    const storedAuth = safeGetStorage('skillswap_is_logged_in', false)
    if (!storedAuth) return null
    const storedUser = safeGetStorage('skillswap_current_user', null)
    return storedUser || null
  })

  // Keep state synced with localStorage
  useEffect(() => {
    safeSetStorage('skillswap_is_logged_in', isLoggedIn)
    if (isLoggedIn && user) {
      safeSetStorage('skillswap_current_user', user)
    } else {
      try {
        localStorage.removeItem('skillswap_current_user')
      } catch {
        // ignore
      }
    }
  }, [isLoggedIn, user])

  // Save users directory whenever it changes
  useEffect(() => {
    if (users && users.length > 0) {
      safeSetStorage('skillswap_users', users)
    }
  }, [users])

  // Login action with validation against demo user accounts
  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    // Find user in registered demo users
    const found = users.find(u => u.email.toLowerCase() === cleanEmail)
    if (!found) {
      return {
        success: false,
        message: 'No account found with this email. Please check your email or sign up.',
      }
    }

    // Verify password (demo check: password123 or matches stored password)
    if (found.password && cleanPassword !== found.password) {
      return {
        success: false,
        message: 'Incorrect password. (Hint: Demo password is "password123")',
      }
    }

    setUser(found)
    setIsLoggedIn(true)
    return { success: true, user: found }
  }

  // Quick 1-click login as a demo account (for effortless multi-user testing)
  const loginAsDemo = (demoId = 0) => {
    const target = users.find(u => u.id === demoId) || users[0]
    if (target) {
      setUser(target)
      setIsLoggedIn(true)
      return { success: true, user: target }
    }
    return { success: false, message: 'Demo user not found.' }
  }

  // Signup action with validation and new account creation
  const signup = (name, email, password) => {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    // Check if email already registered
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
    setUsers(updatedUsers)
    safeSetStorage('skillswap_users', updatedUsers)

    setUser(newUser)
    setIsLoggedIn(true)
    return { success: true, user: newUser }
  }

  // Update profile information and sync immediately with AuthContext & localStorage
  const updateProfile = (updatedFields) => {
    if (!user) return false

    const updatedUser = {
      ...user,
      ...updatedFields,
    }

    setUser(updatedUser)
    safeSetStorage('skillswap_current_user', updatedUser)

    setUsers(prevUsers => {
      const nextUsers = prevUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
      safeSetStorage('skillswap_users', nextUsers)
      return nextUsers
    })

    return true
  }

  // Logout action
  const logout = () => {
    setUser(null)
    setIsLoggedIn(false)
    try {
      localStorage.setItem('skillswap_is_logged_in', 'false')
      localStorage.removeItem('skillswap_current_user')
    } catch {
      // ignore
    }
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
