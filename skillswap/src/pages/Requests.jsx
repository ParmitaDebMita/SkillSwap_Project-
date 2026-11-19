import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import RequestCard from '../components/RequestCard'
import './Requests.css'

export default function Requests() {
  const { requests } = useData()
  const [activeTab, setActiveTab] = useState('received') // 'received' or 'sent'
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'pending', 'accepted', 'rejected'

  const receivedCount = requests.filter(r => r.type === 'received').length
  const sentCount = requests.filter(r => r.type === 'sent').length
  const pendingReceived = requests.filter(r => r.type === 'received' && r.status === 'pending').length

  const filteredRequests = requests.filter(r => {
    const matchesTab = r.type === activeTab
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesTab && matchesStatus
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
              {pendingReceived > 0 && <span className="tab-pending-dot" title="Pending requests"></span>}
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
            <h3>No {statusFilter !== 'all' ? statusFilter : ''} {activeTab} requests found</h3>
            <p>
              {activeTab === 'received'
                ? 'When someone invites you to an exchange, their invitation will appear here.'
                : 'Browse student profiles in Explore Skills and send exchange proposals!'}
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
