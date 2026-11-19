import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import './RequestCard.css'

export default function RequestCard({ request }) {
  const { updateRequestStatus } = useData()
  const { user } = useAuth()

  // Determine if this request was received by the current user or sent by them
  const isReceived = request.toId === user?.id || request.to?.id === user?.id
  const person = isReceived ? request.from : request.to

  const statusClass = {
    pending: 'badge-warning',
    accepted: 'badge-success',
    rejected: 'badge-danger',
  }

  const handleAccept = () => {
    updateRequestStatus(request.id, 'accepted')
  }

  const handleReject = () => {
    updateRequestStatus(request.id, 'rejected')
  }

  return (
    <div className={`request-card request-${request.status}`}>
      <div className="request-card-header">
        <span className="request-avatar">{person?.avatar || '🎓'}</span>
        <div className="request-info">
          <h4 className="request-name">
            {isReceived ? person?.name : `Sent to: ${person?.name}`}
          </h4>
          <p className="request-date">
            {person?.university ? `${person.university} • ` : ''}{request.date}
          </p>
        </div>
        <span className={`badge ${statusClass[request.status]}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      {request.message && (
        <p className="request-message">{request.message}</p>
      )}

      <div className="request-skills">
        <div className="request-skill-exchange">
          <span className="badge badge-primary">{request.skillOffered}</span>
          <span className="exchange-arrow">⇄</span>
          <span className="badge badge-accent">{request.skillWanted}</span>
        </div>
      </div>

      {/* Receiver actions on pending requests */}
      {isReceived && request.status === 'pending' && (
        <div className="request-actions">
          <button
            className="btn btn-accent btn-sm"
            onClick={handleAccept}
          >
            ✓ Accept
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReject}
          >
            ✕ Reject
          </button>
        </div>
      )}

      {/* Helper notice if accepted */}
      {request.status === 'accepted' && (
        <div className="request-status-notice notice-accepted">
          ✓ Exchange confirmed! You can connect with {person?.name} to begin learning.
        </div>
      )}

      {/* Helper notice if rejected */}
      {request.status === 'rejected' && (
        <div className="request-status-notice notice-rejected">
          ✕ This request was declined.
        </div>
      )}
    </div>
  )
}
