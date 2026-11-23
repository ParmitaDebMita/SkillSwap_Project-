import { useState, useEffect } from 'react'
import { useData } from '../hooks/useData'
import { useAuth } from '../hooks/useAuth'
import { reviewService } from '../services/reviewService'
import { moderationService } from '../services/moderationService'
import ExchangeChat from './ExchangeChat'
import './RequestCard.css'

export default function RequestCard({ request }) {
  const { updateRequestStatus, scheduleSession, cancelSession } = useData()
  const { user } = useAuth()
  const [updating, setUpdating] = useState(false)

  // Chat modal state
  const [showChat, setShowChat] = useState(false)

  // Session scheduling state
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [sessionDate, setSessionDate] = useState(request.session?.date || '')
  const [sessionTime, setSessionTime] = useState(request.session?.time || '')
  const [sessionNote, setSessionNote] = useState(request.session?.note || '')
  const [sessionSaving, setSessionSaving] = useState(false)
  const [sessionError, setSessionError] = useState('')

  // Review & Rating state
  const [reviews, setReviews] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Moderation state
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Inappropriate behavior')
  const [reportDetails, setReportDetails] = useState('')
  const [moderationMsg, setModerationMsg] = useState('')

  // Determine if this request was received by the current user or sent by them
  const isReceived = request.toId === user?.id || request.to?.id === user?.id
  const person = isReceived ? request.from : request.to

  const statusClass = {
    pending: 'badge-warning',
    accepted: 'badge-success',
    completed: 'badge-primary',
    rejected: 'badge-danger',
  }

  // Load reviews for completed exchange
  useEffect(() => {
    let cancelled = false
    if (request.status === 'completed') {
      reviewService.getExchangeReviews(request.id).then((list) => {
        if (!cancelled) setReviews(list)
      })
    }
    return () => {
      cancelled = true
    }
  }, [request.id, request.status])

  const myReview = reviews.find((r) => r.reviewerId === user?.id)

  const handleAccept = async () => {
    setUpdating(true)
    await updateRequestStatus(request.id, 'accepted')
    setUpdating(false)
  }

  const handleReject = async () => {
    setUpdating(true)
    await updateRequestStatus(request.id, 'rejected')
    setUpdating(false)
  }

  const handleMarkCompleted = async () => {
    setUpdating(true)
    await updateRequestStatus(request.id, 'completed')
    setUpdating(false)
  }

  const handleSaveSession = async (e) => {
    e.preventDefault()
    if (!sessionDate || !sessionTime) {
      setSessionError('Please select both a date and time.')
      return
    }
    setSessionSaving(true)
    setSessionError('')
    const res = await scheduleSession(request.id, {
      date: sessionDate,
      time: sessionTime,
      note: sessionNote,
    })
    setSessionSaving(false)
    if (res.success) {
      setShowScheduleForm(false)
    } else {
      setSessionError(res.error || 'Failed to save session.')
    }
  }

  const handleCancelSession = async () => {
    if (!window.confirm('Are you sure you want to cancel this scheduled session?')) return
    setSessionSaving(true)
    await cancelSession(request.id)
    setSessionSaving(false)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewFeedback.trim()) {
      setReviewError('Please share a few words of feedback.')
      return
    }
    setReviewSubmitting(true)
    setReviewError('')
    const res = await reviewService.submitReview(request.id, {
      rating: Number(reviewRating),
      feedback: reviewFeedback.trim(),
    })
    setReviewSubmitting(false)
    if (res.success) {
      setReviews((prev) => [...prev, res.review])
      setShowReviewModal(false)
    } else {
      setReviewError(res.error || 'Failed to submit review.')
    }
  }

  const handleReport = async (e) => {
    e.preventDefault()
    if (!person?.id) return
    const res = await moderationService.reportUser({
      reportedUserId: person.id,
      reason: reportReason,
      details: reportDetails,
    })
    setShowReportModal(false)
    setModerationMsg(res.success ? '✓ Report submitted.' : `⚠️ ${res.error}`)
    setTimeout(() => setModerationMsg(''), 4000)
  }

  const handleBlock = async () => {
    if (!person?.id) return
    if (!window.confirm(`Are you sure you want to block ${person.name}?`)) return
    const res = await moderationService.blockUser(person.id)
    setShowMenu(false)
    setModerationMsg(res.success ? `✓ ${person.name} has been blocked.` : `⚠️ ${res.error}`)
    setTimeout(() => setModerationMsg(''), 4000)
  }

  const session = request.session

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
        <div className="header-badges-wrap">
          <span className={`badge ${statusClass[request.status] || 'badge-warning'}`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
          <div className="moderation-menu-wrapper">
            <button
              className="btn-icon-subtle"
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
              aria-label="Options"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="moderation-dropdown">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowReportModal(true)
                  }}
                >
                  🚩 Report Student
                </button>
                <button onClick={handleBlock} className="text-danger">
                  🚫 Block Student
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {moderationMsg && (
        <div className="moderation-alert animate-fade-in">{moderationMsg}</div>
      )}

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
            disabled={updating}
          >
            {updating ? '⏳' : '✓ Accept'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReject}
            disabled={updating}
          >
            {updating ? '⏳' : '✕ Reject'}
          </button>
        </div>
      )}

      {/* Session Scheduling Box for Accepted / Completed */}
      {(request.status === 'accepted' || request.status === 'completed') && (
        <div className="session-card-box">
          <div className="session-header-row">
            <span className="session-icon">📅</span>
            <div className="session-info-text">
              {session && session.date && session.status !== 'cancelled' ? (
                <>
                  <strong>Session: {session.date} at {session.time}</strong>
                  <span className={`session-status-tag tag-${session.status}`}>
                    {session.status}
                  </span>
                  {session.note && <p className="session-note">"{session.note}"</p>}
                </>
              ) : session && session.status === 'cancelled' ? (
                <span className="text-muted">Previous session was cancelled.</span>
              ) : (
                <span className="text-muted">No session scheduled yet.</span>
              )}
            </div>
            {request.status === 'accepted' && !showScheduleForm && (
              <div className="session-btns-wrap">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowScheduleForm(true)}
                >
                  {session && session.date && session.status !== 'cancelled' ? 'Reschedule' : '+ Schedule'}
                </button>
                {session && session.date && session.status !== 'cancelled' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCancelSession}
                    disabled={sessionSaving}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>

          {showScheduleForm && (
            <form className="schedule-inline-form animate-fade-in" onSubmit={handleSaveSession}>
              {sessionError && <div className="schedule-error">⚠️ {sessionError}</div>}
              <div className="schedule-inputs-row">
                <div className="form-group-sm">
                  <label>Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group-sm">
                  <label>Time</label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group-sm">
                <input
                  type="text"
                  placeholder="Optional meeting note or topic (e.g. Google Meet link, chapter 3)..."
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                />
              </div>
              <div className="schedule-actions-row">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowScheduleForm(false)}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={sessionSaving}>
                  {sessionSaving ? 'Saving…' : 'Confirm Session'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Actions Bar for Accepted */}
      {request.status === 'accepted' && (
        <div className="request-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowChat(true)}
          >
            💬 Message {person?.name?.split(' ')[0]}
          </button>
          <button
            className="btn btn-accent btn-sm"
            onClick={handleMarkCompleted}
            disabled={updating}
          >
            {updating ? '⏳' : '✓ Mark as Completed'}
          </button>
        </div>
      )}

      {/* Completed State Actions */}
      {request.status === 'completed' && (
        <div className="request-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowChat(true)}
          >
            💬 View Chat History
          </button>
          {myReview ? (
            <span className="badge badge-accent review-status-pill">
              ⭐ You Rated: {myReview.rating}★
            </span>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowReviewModal(true)}
            >
              ⭐ Leave Review & Feedback
            </button>
          )}
        </div>
      )}

      {/* Status notices */}
      {request.status === 'accepted' && (
        <div className="request-status-notice notice-accepted">
          ✓ Exchange confirmed! Private chat & session scheduling are active.
        </div>
      )}

      {request.status === 'completed' && (
        <div className="request-status-notice notice-completed">
          🎉 Exchange successfully completed!
        </div>
      )}

      {request.status === 'rejected' && (
        <div className="request-status-notice notice-rejected">
          ✕ This request was declined.
        </div>
      )}

      {/* Private Chat Dialog */}
      {showChat && (
        <ExchangeChat
          exchange={request}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Feedback / Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
            <div className="modal-header">
              <span className="modal-avatar">⭐</span>
              <div>
                <h3>Rate your exchange with {person?.name}</h3>
                <small style={{ color: 'var(--text-muted)' }}>Help peers know how learning went</small>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="modal-body">
              {reviewError && (
                <div style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  ⚠️ {reviewError}
                </div>
              )}

              <div className="modal-field">
                <label>Rating (1 to 5 Stars):</label>
                <div className="star-rating-select">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`star-btn ${reviewRating >= star ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="star-rating-label">{reviewRating}.0 Stars</span>
                </div>
              </div>

              <div className="modal-field">
                <label>Your Feedback:</label>
                <textarea
                  rows="3"
                  placeholder="How was the skill exchange? What did you learn together?"
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={reviewSubmitting}
                style={{ width: '100%', marginTop: '10px' }}
              >
                {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowReportModal(false)}>✕</button>
            <div className="modal-header">
              <span className="modal-avatar">🚩</span>
              <div>
                <h3>Report {person?.name}</h3>
                <small style={{ color: 'var(--text-muted)' }}>Keep SkillSwap safe and welcoming</small>
              </div>
            </div>

            <form onSubmit={handleReport} className="modal-body">
              <div className="modal-field">
                <label>Reason for report:</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                  <option value="Inappropriate behavior">Inappropriate behavior</option>
                  <option value="Spam or advertising">Spam or advertising</option>
                  <option value="Harassment or abuse">Harassment or abuse</option>
                  <option value="No-show / ghosting">No-show / ghosting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="modal-field">
                <label>Details (optional):</label>
                <textarea
                  rows="3"
                  placeholder="Provide additional context for moderators..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '10px' }}
              >
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
