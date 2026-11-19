import { useData } from '../context/DataContext'
import './RequestCard.css'

export default function RequestCard({ request }) {
  const { updateRequestStatus } = useData()
  const person = request.type === 'received' ? request.from : request.to
  const isReceived = request.type === 'received'

  const statusClass = {
    pending: 'badge-warning',
    accepted: 'badge-success',
    rejected: 'badge-danger',
  }

  return (
    <div className={`request-card request-${request.status}`}>
      <div className="request-card-header">
        <span className="request-avatar">{person.avatar}</span>
        <div className="request-info">
          <h4 className="request-name">{person.name}</h4>
          <p className="request-date">{request.date}</p>
        </div>
        <span className={`badge ${statusClass[request.status]}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <p className="request-message">{request.message}</p>

      <div className="request-skills">
        <div className="request-skill-exchange">
          <span className="badge badge-primary">{request.skillOffered}</span>
          <span className="exchange-arrow">⇄</span>
          <span className="badge badge-accent">{request.skillWanted}</span>
        </div>
      </div>

      {isReceived && request.status === 'pending' && (
        <div className="request-actions">
          <button
            className="btn btn-accent btn-sm"
            onClick={() => updateRequestStatus(request.id, 'accepted')}
          >
            ✓ Accept
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => updateRequestStatus(request.id, 'rejected')}
          >
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  )
}

