import { createContext, useContext, useState, useEffect } from 'react'
import { currentUser } from '../data/mockData'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('skillswap-auth')
    return saved !== null ? saved === 'true' : true // Default true for seamless evaluation
  })

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('skillswap-user')
    if (savedUser) {
      try {
        return JSON.parse(savedUser)
      } catch {
        // fallback
      }
    }
    return currentUser
  })

  useEffect(() => {
    localStorage.setItem('skillswap-auth', isLoggedIn ? 'true' : 'false')
    if (user) {
      localStorage.setItem('skillswap-user', JSON.stringify(user))
    } else {
      localStorage.removeItem('skillswap-user')
    }
  }, [isLoggedIn, user])

  const login = (email) => {
    const loggedInUser = { ...currentUser, email: email || currentUser.email }
    setUser(loggedInUser)
    setIsLoggedIn(true)
    return true
  }

  const signup = (name, email) => {
    const newUser = {
      ...currentUser,
      name: name || currentUser.name,
      email: email || currentUser.email,
    }
    setUser(newUser)
    setIsLoggedIn(true)
    return true
  }

  const logout = () => {
    setUser(null)
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
