import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import RequestCard from '../components/RequestCard'
import './Requests.css'

export default function Requests() {
  const { requests } = useData()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('received') // 'received' or 'sent'
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'pending', 'accepted', 'rejected'

  // Filter requests dynamically based on currently logged-in user
  const receivedRequests = requests.filter(
    r => r.toId === user?.id || r.to?.id === user?.id
  )
  const sentRequests = requests.filter(
    r => r.fromId === user?.id || r.from?.id === user?.id
  )

  const receivedCount = receivedRequests.length
  const sentCount = sentRequests.length
  const pendingReceived = receivedRequests.filter(r => r.status === 'pending').length

  const currentTabRequests = activeTab === 'received' ? receivedRequests : sentRequests

  const filteredRequests = currentTabRequests.filter(r => {
    return statusFilter === 'all' || r.status === statusFilter
  })

  return (
    <div className="requests-page page-container">
      <div className="container">
        {/* Header */}
        <div className="requests-header">
          <div>
            <h1 className="section-title">Exchange Requests</h1>
            <p className="section-subtitle">
              Manage incoming and outgoing skill swap proposals with your peers.
            </p>
          </div>
          <Link to="/explore" className="btn btn-primary btn-sm">
            + Find New Skills
          </Link>
        </div>

        {/* Tab Selection */}
        <div className="requests-nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            📥 Received Requests
            <span className="tab-counter">
              {receivedCount}
              {pendingReceived > 0 && (
                <span className="tab-pending-dot" title={`${pendingReceived} pending requests`}></span>
              )}
            </span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            📤 Sent Requests
            <span className="tab-counter">{sentCount}</span>
          </button>
        </div>

        {/* Sub-Filters: Status */}
        <div className="status-filters-row">
          <span className="filter-label">Filter by status:</span>
          {['all', 'pending', 'accepted', 'rejected'].map(status => (
            <button
              key={status}
              className={`status-chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length > 0 ? (
          <div className="requests-grid animate-fade-in">
            {filteredRequests.map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        ) : (
          <div className="requests-empty">
            <span className="empty-icon">
              {activeTab === 'received' ? '📭' : '🚀'}
            </span>
            <h3>
              No {statusFilter !== 'all' ? statusFilter : ''} {activeTab} requests found
            </h3>
            <p>
              {activeTab === 'received'
                ? 'When another student invites you to a skill exchange, their proposal will appear here for you to accept or decline.'
                : 'Browse student profiles in Explore Skills and send an exchange proposal to learn something new!'}
            </p>
            <Link to="/explore" className="btn btn-outline btn-sm">
              Explore Skills Now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
