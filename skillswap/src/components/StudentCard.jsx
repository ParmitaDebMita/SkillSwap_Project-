import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useData } from '../hooks/useData'
import { useAuth } from '../hooks/useAuth'
import { moderationService } from '../services/moderationService'
import './StudentCard.css'

export default function StudentCard({ student }) {
  const { sendRequest } = useData()
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState('')
  const [customOfferInput, setCustomOfferInput] = useState('')
  const [selectedWant, setSelectedWant] = useState('')
  const [customMsg, setCustomMsg] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Moderation state
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Inappropriate behavior')
  const [reportDetails, setReportDetails] = useState('')
  const [modFeedback, setModFeedback] = useState('')

  const isSelf = user && user.id === student.id
  const userHasOfferedSkills = user?.skillsOffered && user.skillsOffered.length > 0
  const availableOfferSkills = userHasOfferedSkills ? user.skillsOffered : []

  const handleOpenModal = () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    if (isSelf) return
    setErrorMsg('')
    setCustomMsg('')
    setSelectedOffer(availableOfferSkills[0] || '')
    setSelectedWant(student.skillsOffered?.[0] || '')
    setShowModal(true)
  }

  const handleSend = async () => {
    const finalOfferSkill = (selectedOffer === '__custom__' ? customOfferInput : selectedOffer).trim()
    const finalWantSkill = selectedWant.trim()

    if (!finalOfferSkill) {
      setErrorMsg('Please specify a skill you can teach.')
      return
    }

    if (!finalWantSkill) {
      setErrorMsg('Please select a skill you want to learn.')
      return
    }

    setErrorMsg('')
    setSending(true)

    const res = await sendRequest(student.id, finalOfferSkill, finalWantSkill, customMsg)
    setSending(false)

    if (res && res.success) {
      setSent(true)
      setTimeout(() => {
        setShowModal(false)
        setSent(false)
        setSelectedOffer('')
        setSelectedWant('')
        setCustomOfferInput('')
        setCustomMsg('')
      }, 1500)
    } else {
      setErrorMsg(res?.error || 'A pending exchange request already exists with this student.')
    }
  }

  const handleReport = async (e) => {
    e.preventDefault()
    const res = await moderationService.reportUser({
      reportedUserId: student.id,
      reason: reportReason,
      details: reportDetails,
    })
    setShowReportModal(false)
    setModFeedback(res.success ? '✓ Report submitted.' : `⚠️ ${res.error}`)
    setTimeout(() => setModFeedback(''), 4000)
  }

  const handleBlock = async () => {
    if (!window.confirm(`Are you sure you want to block ${student.name}?`)) return
    const res = await moderationService.blockUser(student.id)
    setShowMenu(false)
    setModFeedback(res.success ? `✓ ${student.name} blocked.` : `⚠️ ${res.error}`)
    setTimeout(() => setModFeedback(''), 4000)
  }

  const renderSkillBadge = (skill, colorClass) => {
    const match = skill.match(/^(.*?)\s*\((Beginner|Intermediate|Advanced)\)$/i)
    if (match) {
      return (
        <span key={skill} className={`badge ${colorClass} skill-chip-lvl`}>
          <span>{match[1]}</span>
          <span className={`tag-lvl lvl-${match[2].toLowerCase()}`}>{match[2]}</span>
        </span>
      )
    }
    return (
      <span key={skill} className={`badge ${colorClass}`}>
        {skill}
      </span>
    )
  }

  return (
    <>
      <div className="student-card">
        <div className="student-card-header">
          <span className="student-avatar">{student.avatar}</span>
          <div className="student-info">
            <h3 className="student-name">
              {student.name} {isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>(You)</span>}
            </h3>
            <p className="student-university">{student.university}</p>
          </div>
          <div className="student-card-top-right">
            <div className="student-rating">
              <span>⭐</span> {student.rating !== undefined ? Number(student.rating).toFixed(1) : '5.0'}
            </div>
            {!isSelf && isLoggedIn && (
              <div className="student-mod-menu-wrap">
                <button
                  className="btn-mod-menu"
                  onClick={() => setShowMenu(!showMenu)}
                  title="Options"
                  aria-label="Options"
                >
                  ⋮
                </button>
                {showMenu && (
                  <div className="student-mod-dropdown">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setShowReportModal(true)
                      }}
                    >
                      🚩 Report
                    </button>
                    <button onClick={handleBlock} className="text-danger">
                      🚫 Block
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {modFeedback && <div className="student-mod-alert animate-fade-in">{modFeedback}</div>}

        <p className="student-bio">{student.bio}</p>

        {/* Availability */}
        {student.availability && student.availability.length > 0 && (
          <div className="student-availability-row">
            <span className="avail-label">🕒 Available:</span>
            <div className="avail-tags-wrap">
              {student.availability.map((a) => (
                <span key={a} className="avail-tag">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="student-skills">
          <div className="skills-group">
            <span className="skills-label">Teaches</span>
            <div className="skill-tags">
              {student.skillsOffered?.map((skill) => renderSkillBadge(skill, 'badge-primary'))}
            </div>
          </div>
          <div className="skills-group">
            <span className="skills-label">Wants to Learn</span>
            <div className="skill-tags">
              {student.skillsWanted?.map((skill) => renderSkillBadge(skill, 'badge-secondary'))}
            </div>
          </div>
        </div>

        <div className="student-card-footer">
          <span className="exchange-count">{student.exchanges || 0} exchanges</span>
          {isSelf ? (
            <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
              Your Profile
            </span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleOpenModal}>
              Exchange Skills
            </button>
          )}
        </div>
      </div>

      {/* Exchange Proposal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !sending && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => !sending && setShowModal(false)}
              aria-label="Close modal"
              disabled={sending}
            >
              ✕
            </button>
            <div className="modal-header">
              <span className="modal-avatar">{student.avatar}</span>
              <div>
                <h3>Exchange with {student.name}</h3>
                <small style={{ color: 'var(--text-muted)' }}>{student.university}</small>
              </div>
            </div>

            {sent ? (
              <div className="modal-success">
                <span className="success-icon">✅</span>
                <p>Request sent successfully!</p>
              </div>
            ) : (
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div className="modal-field">
                  <label>I will teach:</label>
                  {availableOfferSkills.length > 0 ? (
                    <>
                      <select
                        value={selectedOffer}
                        onChange={(e) => setSelectedOffer(e.target.value)}
                        disabled={sending}
                      >
                        {availableOfferSkills.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        <option value="__custom__">+ Enter another skill...</option>
                      </select>
                      {selectedOffer === '__custom__' && (
                        <input
                          type="text"
                          placeholder="Type custom skill to teach..."
                          value={customOfferInput}
                          onChange={(e) => setCustomOfferInput(e.target.value)}
                          disabled={sending}
                          style={{
                            marginTop: '8px',
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Type a skill you can teach (e.g. Python, React)..."
                        value={customOfferInput}
                        onChange={(e) => {
                          setCustomOfferInput(e.target.value)
                          setSelectedOffer('__custom__')
                        }}
                        disabled={sending}
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
                      <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        Tip: You can also add skills permanently in <Link to="/profile">your profile</Link>.
                      </small>
                    </div>
                  )}
                </div>

                <div className="modal-field">
                  <label>I want to learn from {student.name}:</label>
                  <select
                    value={selectedWant}
                    onChange={(e) => setSelectedWant(e.target.value)}
                    disabled={sending}
                  >
                    {student.skillsOffered?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-field">
                  <label>Proposal Message (Optional):</label>
                  <input
                    type="text"
                    placeholder={`Hi ${student.name}, let's swap skills!`}
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    disabled={sending}
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
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={sending}
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {sending ? '⏳ Sending…' : 'Send Exchange Request'}
                </button>
              </div>
            )}
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
                <h3>Report {student.name}</h3>
                <small style={{ color: 'var(--text-muted)' }}>Help maintain a safe learning community</small>
              </div>
            </div>

            <form onSubmit={handleReport} className="modal-body">
              <div className="modal-field">
                <label>Reason for report:</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                  <option value="Inappropriate behavior">Inappropriate behavior</option>
                  <option value="Spam or advertising">Spam or advertising</option>
                  <option value="Harassment or abuse">Harassment or abuse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="modal-field">
                <label>Details (optional):</label>
                <textarea
                  rows="3"
                  placeholder="Provide context for moderators..."
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
    </>
  )
}
