import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { students as initialStudents, initialRequests } from '../data/mockData'
import { useAuth } from './AuthContext'

const DataContext = createContext()

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

export function DataProvider({ children }) {
  const { user, updateProfile } = useAuth()

  // Base students directory persisted in localStorage
  const [baseStudents, setBaseStudents] = useState(() => {
    const stored = safeGetStorage('skillswap_students', null)
    if (Array.isArray(stored) && stored.length > 0) {
      return stored
    }
    safeSetStorage('skillswap_students', initialStudents)
    return initialStudents
  })

  // Exchange requests persisted in localStorage
  const [requests, setRequests] = useState(() => {
    const stored = safeGetStorage('skillswap_requests', null)
    if (Array.isArray(stored)) {
      return stored
    }
    safeSetStorage('skillswap_requests', initialRequests)
    return initialRequests
  })

  // Save requests whenever they change
  useEffect(() => {
    safeSetStorage('skillswap_requests', requests)
  }, [requests])

  // Save students whenever they change
  useEffect(() => {
    safeSetStorage('skillswap_students', baseStudents)
  }, [baseStudents])

  // Dynamically merge current user's profile so directory is always in sync without setState in effects
  const students = useMemo(() => {
    const list = [...baseStudents]
    if (user) {
      const idx = list.findIndex(s => s.id === user.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...user }
      }
    }
    return list
  }, [baseStudents, user])

  // Send an exchange request from current user to target student
  const sendRequest = (studentId, skillOffered, skillWanted, message = '') => {
    if (!user) {
      return { success: false, error: 'You must be logged in to send a request.' }
    }

    if (user.id === studentId) {
      return { success: false, error: 'You cannot send an exchange request to yourself.' }
    }

    const target = students.find(s => s.id === studentId)
    if (!target) {
      return { success: false, error: 'Selected student was not found.' }
    }

    // Prevent duplicate pending requests between these two students
    const duplicate = requests.some(r => {
      const senderId = r.fromId !== undefined ? r.fromId : r.from?.id
      const receiverId = r.toId !== undefined ? r.toId : r.to?.id
      const isSamePair =
        (senderId === user.id && receiverId === target.id) ||
        (senderId === target.id && receiverId === user.id)
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
      fromId: user.id,
      toId: target.id,
      from: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        university: user.university,
        email: user.email,
      },
      to: {
        id: target.id,
        name: target.name,
        avatar: target.avatar,
        university: target.university,
        email: target.email,
      },
      skillOffered,
      skillWanted,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      message:
        message.trim() ||
        `Hi ${target.name}! I'd love to exchange ${skillOffered} for ${skillWanted}. Let's learn together!`,
    }

    const updated = [newRequest, ...requests]
    setRequests(updated)
    safeSetStorage('skillswap_requests', updated)
    return { success: true, request: newRequest }
  }

  // Accept or Reject a request
  const updateRequestStatus = (requestId, newStatus) => {
    let acceptedRequest = null

    const updatedRequests = requests.map(r => {
      if (r.id === requestId) {
        if (newStatus === 'accepted') {
          acceptedRequest = r
        }
        return { ...r, status: newStatus }
      }
      return r
    })

    setRequests(updatedRequests)
    safeSetStorage('skillswap_requests', updatedRequests)

    // If accepted, update exchange counts for the involved students
    if (acceptedRequest && newStatus === 'accepted') {
      const p1Id =
        acceptedRequest.fromId !== undefined ? acceptedRequest.fromId : acceptedRequest.from?.id
      const p2Id =
        acceptedRequest.toId !== undefined ? acceptedRequest.toId : acceptedRequest.to?.id

      setBaseStudents(prev =>
        prev.map(s => {
          if (s.id === p1Id || s.id === p2Id) {
            return { ...s, exchanges: (s.exchanges || 0) + 1 }
          }
          return s
        })
      )

      if (user && (user.id === p1Id || user.id === p2Id)) {
        updateProfile({ exchanges: (user.exchanges || 0) + 1 })
      }
    }

    return true
  }

  return (
    <DataContext.Provider
      value={{
        students,
        requests,
        sendRequest,
        updateRequestStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}
