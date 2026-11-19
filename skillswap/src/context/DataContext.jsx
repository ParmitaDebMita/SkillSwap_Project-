import { useState, useEffect, useMemo } from 'react'
import { DataContext } from './contexts'
import { studentService } from '../services/studentService'
import { exchangeService } from '../services/exchangeService'
import { useAuth } from '../hooks/useAuth'

export function DataProvider({ children }) {
  const { user, updateProfile } = useAuth()

  // Base students directory
  const [baseStudents, setBaseStudents] = useState(() => studentService.getStudents())

  // Exchange proposals
  const [requests, setRequests] = useState(() => exchangeService.getRequests())

  // Save students whenever base students change
  useEffect(() => {
    studentService.saveStudents(baseStudents)
  }, [baseStudents])

  // Dynamically merge currently logged in user profile with student directory
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

  // Send an exchange request
  const sendRequest = (studentId, skillOffered, skillWanted, message = '') => {
    const target = students.find(s => s.id === studentId)
    if (!target) {
      return { success: false, error: 'Selected student was not found.' }
    }

    const res = exchangeService.createRequest(user, target, skillOffered, skillWanted, message)
    if (res.success) {
      setRequests(res.requests)
    }
    return res
  }

  // Accept or reject a proposal
  const updateRequestStatus = (requestId, newStatus) => {
    const res = exchangeService.updateStatus(requestId, newStatus)
    if (res.success) {
      setRequests(res.requests)

      // If accepted, increment exchanges count for both students
      if (newStatus === 'accepted' && res.updatedRequest) {
        const p1Id = res.updatedRequest.fromId ?? res.updatedRequest.from?.id
        const p2Id = res.updatedRequest.toId ?? res.updatedRequest.to?.id

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
    }
    return res.success
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
