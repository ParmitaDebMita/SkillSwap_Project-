import { createContext, useContext, useState } from 'react'
import { students as initialStudents, initialRequests, currentUser } from '../data/mockData'

const DataContext = createContext()

export function DataProvider({ children }) {
  const [students] = useState(initialStudents)
  const [requests, setRequests] = useState(initialRequests)

  const sendRequest = (studentId, skillOffered, skillWanted, message) => {
    const target = students.find(s => s.id === studentId)
    if (!target) return false

    const alreadyExists = requests.find(
      r => r.type === 'sent' && r.to.id === studentId && r.status === 'pending'
    )
    if (alreadyExists) return false

    const newRequest = {
      id: Date.now(),
      from: currentUser,
      to: target,
      skillOffered,
      skillWanted,
      status: 'pending',
      type: 'sent',
      date: new Date().toISOString().split('T')[0],
      message: message || `Hi ${target.name}! I'd love to exchange ${skillOffered} for ${skillWanted}.`,
    }
    setRequests(prev => [newRequest, ...prev])
    return true
  }

  const updateRequestStatus = (requestId, newStatus) => {
    setRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: newStatus } : r))
    )
  }

  return (
    <DataContext.Provider value={{ students, requests, sendRequest, updateRequestStatus }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}

