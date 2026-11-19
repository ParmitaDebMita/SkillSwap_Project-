import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import './StudentCard.css'

export default function StudentCard({ student }) {
  const { sendRequest } = useData()
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState('')
  const [selectedWant, setSelectedWant] = useState('')
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleOpenModal = () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setErrorMsg('')
    setShowModal(true)
  }

  const handleSend = () => {
    if (!selectedOffer || !selectedWant) return
    setErrorMsg('')
    const success = sendRequest(student.id, selectedOffer, selectedWant)
    if (success) {
      setSent(true)
      setTimeout(() => {
        setShowModal(false)
        setSent(false)
        setSelectedOffer('')
        setSelectedWant('')
      }, 1500)
    } else {
      setErrorMsg('You already have a pending exchange request with this student.')
    }
  }

  const availableOfferSkills = user?.skillsOffered || [
    'React',
    'Node.js',
    'TypeScript',
    'JavaScript',
  ]

  return (
    <>
      <div className="student-card">
        <div className="student-card-header">
          <span className="student-avatar">{student.avatar}</span>
          <div className="student-info">
            <h3 className="student-name">{student.name}</h3>
            <p className="student-university">{student.university}</p>
          </div>
          <div className="student-rating">
            <span>⭐</span> {student.rating}
          </div>
        </div>

        <p className="student-bio">{student.bio}</p>

        <div className="student-skills">
          <div className="skills-group">
            <span className="skills-label">Teaches</span>
            <div className="skill-tags">
              {student.skillsOffered.map(skill => (
                <span key={skill} className="badge badge-primary">{skill}</span>
              ))}
            </div>
          </div>
          <div className="skills-group">
            <span className="skills-label">Wants to Learn</span>
            <div className="skill-tags">
              {student.skillsWanted.map(skill => (
                <span key={skill} className="badge badge-secondary">{skill}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="student-card-footer">
          <span className="exchange-count">{student.exchanges} exchanges</span>
          <button className="btn btn-primary btn-sm" onClick={handleOpenModal}>
            Exchange Skills
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
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
                  <select value={selectedOffer} onChange={e => setSelectedOffer(e.target.value)}>
                    <option value="">Select a skill you can offer</option>
                    {availableOfferSkills.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label>I want to learn:</label>
                  <select value={selectedWant} onChange={e => setSelectedWant(e.target.value)}>
                    <option value="">Select a skill you want</option>
                    {student.skillsOffered.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={!selectedOffer || !selectedWant}
                  style={{ width: '100%', marginTop: '12px', opacity: (!selectedOffer || !selectedWant) ? 0.6 : 1 }}
                >
                  Send Exchange Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
