import { useState, useEffect, useCallback } from 'react'
import { DataContext } from './contexts'
import { studentService } from '../services/studentService'
import { exchangeService } from '../services/exchangeService'
import { useAuth } from '../hooks/useAuth'

export function DataProvider({ children }) {
  const { user, isLoggedIn, authLoading } = useAuth()

  // ── Students state ────────────────────────────────────────────────────────
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState(null)

  // ── Exchanges state ───────────────────────────────────────────────────────
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // ── Load students on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function loadStudents() {
      setStudentsLoading(true)
      setStudentsError(null)
      const data = await studentService.getStudents()
      if (!cancelled) {
        setStudents(data)
        setStudentsLoading(false)
        if (data.length === 0) {
          setStudentsError('No students found. The backend may be unavailable.')
        }
      }
    }

    loadStudents()
    return () => { cancelled = true }
  }, [])

  // ── Load exchanges when user logs in ─────────────────────────────────────
  const loadRequests = useCallback(async () => {
    if (!isLoggedIn) {
      setRequests([])
      return
    }
    setRequestsLoading(true)
    const data = await exchangeService.getRequests()
    setRequests(data)
    setRequestsLoading(false)
  }, [isLoggedIn])

  useEffect(() => {
    let cancelled = false
    if (!authLoading && isLoggedIn) {
      exchangeService.getRequests().then(data => {
        if (!cancelled) {
          setRequests(data)
        }
      })
    } else if (!isLoggedIn) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setRequests([])
        }
      })
    }
    return () => {
      cancelled = true
    }
  }, [authLoading, isLoggedIn])

  // ── Send exchange request ─────────────────────────────────────────────────
  /**
   * studentId: the backend string id of the target student
   */
  const sendRequest = useCallback(async (studentId, skillOffered, skillWanted, message = '') => {
    if (!user) return { success: false, error: 'You must be logged in to send a request.' }

    const res = await exchangeService.createRequest(studentId, skillOffered, skillWanted, message)
    if (res.success) {
      // Optimistically prepend the new request
      setRequests(prev => [res.request, ...prev])
    }
    return res
  }, [user])

  // ── Accept / reject / complete request ────────────────────────────────────
  const updateRequestStatus = useCallback(async (requestId, newStatus) => {
    const res = await exchangeService.updateStatus(requestId, newStatus)
    if (res.success) {
      setRequests(prev =>
        prev.map(r => r.id === requestId ? (res.updatedRequest || { ...r, status: newStatus }) : r)
      )
      return true
    }
    console.error('[DataContext] updateRequestStatus failed:', res.error)
    return false
  }, [])

  // ── Session Scheduling ────────────────────────────────────────────────────
  const scheduleSession = useCallback(async (requestId, sessionData) => {
    const res = await exchangeService.scheduleSession(requestId, sessionData)
    if (res.success) {
      setRequests(prev =>
        prev.map(r => r.id === requestId ? res.updatedRequest : r)
      )
      return { success: true }
    }
    return { success: false, error: res.error }
  }, [])

  const cancelSession = useCallback(async (requestId) => {
    const res = await exchangeService.cancelSession(requestId)
    if (res.success) {
      setRequests(prev =>
        prev.map(r => r.id === requestId ? res.updatedRequest : r)
      )
      return { success: true }
    }
    return { success: false, error: res.error }
  }, [])

  // ── Reload students (e.g. after profile update) ───────────────────────────
  const reloadStudents = useCallback(async () => {
    const data = await studentService.getStudents()
    setStudents(data)
  }, [])

  return (
    <DataContext.Provider
      value={{
        students,
        studentsLoading,
        studentsError,
        requests,
        requestsLoading,
        sendRequest,
        updateRequestStatus,
        scheduleSession,
        cancelSession,
        reloadStudents,
        loadRequests,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
