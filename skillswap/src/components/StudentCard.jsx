import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useData } from '../hooks/useData'
import { useAuth } from '../hooks/useAuth'
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

    // Pass student.id (the backend MongoDB string id)
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
          <div className="student-rating">
            <span>⭐</span> {student.rating !== undefined ? Number(student.rating).toFixed(1) : '5.0'}
          </div>
        </div>

        <p className="student-bio">{student.bio}</p>

        <div className="student-skills">
          <div className="skills-group">
            <span className="skills-label">Teaches</span>
            <div className="skill-tags">
              {student.skillsOffered?.map(skill => (
                <span key={skill} className="badge badge-primary">{skill}</span>
              ))}
            </div>
          </div>
          <div className="skills-group">
            <span className="skills-label">Wants to Learn</span>
            <div className="skill-tags">
              {student.skillsWanted?.map(skill => (
                <span key={skill} className="badge badge-secondary">{skill}</span>
              ))}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => !sending && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
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
                        onChange={e => setSelectedOffer(e.target.value)}
                        disabled={sending}
                      >
                        {availableOfferSkills.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="__custom__">+ Enter another skill...</option>
                      </select>
                      {selectedOffer === '__custom__' && (
                        <input
                          type="text"
                          placeholder="Type custom skill to teach..."
                          value={customOfferInput}
                          onChange={e => setCustomOfferInput(e.target.value)}
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
                        onChange={e => {
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
                    onChange={e => setSelectedWant(e.target.value)}
                    disabled={sending}
                  >
                    {student.skillsOffered?.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-field">
                  <label>Proposal Message (Optional):</label>
                  <input
                    type="text"
                    placeholder={`Hi ${student.name}, let's swap skills!`}
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
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
    </>
  )
}
