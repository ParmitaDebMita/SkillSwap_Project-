import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import './Profile.css'

export default function Profile() {
  const { user, updateProfile } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [bio, setBio] = useState('')

  const [newOfferedSkill, setNewOfferedSkill] = useState('')
  const [newWantedSkill, setNewWantedSkill] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Current user skills are derived directly from user object (single source of truth)
  const skillsOffered = user?.skillsOffered || []
  const skillsWanted = user?.skillsWanted || []
  const exchangesCount = user?.exchanges || 0
  const ratingValue = user?.rating !== undefined ? Number(user.rating).toFixed(1) : '5.0'

  const handleStartEditing = () => {
    setName(user?.name || '')
    setUniversity(user?.university || '')
    setBio(user?.bio || '')
    setIsEditing(true)
  }

  const handleAddOffered = (e) => {
    e.preventDefault()
    const clean = newOfferedSkill.trim()
    if (!clean) return

    if (!skillsOffered.includes(clean)) {
      const nextSkills = [...skillsOffered, clean]
      updateProfile({ skillsOffered: nextSkills })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    }
    setNewOfferedSkill('')
  }

  const handleRemoveOffered = (skillToRemove) => {
    const nextSkills = skillsOffered.filter(s => s !== skillToRemove)
    updateProfile({ skillsOffered: nextSkills })
  }

  const handleAddWanted = (e) => {
    e.preventDefault()
    const clean = newWantedSkill.trim()
    if (!clean) return

    if (!skillsWanted.includes(clean)) {
      const nextSkills = [...skillsWanted, clean]
      updateProfile({ skillsWanted: nextSkills })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    }
    setNewWantedSkill('')
  }

  const handleRemoveWanted = (skillToRemove) => {
    const nextSkills = skillsWanted.filter(s => s !== skillToRemove)
    updateProfile({ skillsWanted: nextSkills })
  }

  const handleSave = () => {
    const success = updateProfile({
      name: name.trim() || user?.name || 'Student',
      university: university.trim() || 'University Student',
      bio: bio.trim(),
    })

    if (success) {
      setIsEditing(false)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    }
  }

  return (
    <div className="profile-page page-container">
      <div className="container">
        {savedSuccess && (
          <div className="alert-success-banner animate-fade-in">
            ✓ Profile information saved and updated successfully!
          </div>
        )}

        <div className="profile-layout">
          {/* Left Column: Profile Card */}
          <div className="profile-sidebar">
            <div className="profile-main-card">
              <div className="profile-avatar-wrapper">
                <span className="profile-avatar-big">{user?.avatar || '🚀'}</span>
                <span className="online-badge" title="Active student"></span>
              </div>

              <h2 className="profile-display-name">{user?.name || 'Student'}</h2>
              <p className="profile-display-uni">🎓 {user?.university || 'University Student'}</p>
              <p className="profile-display-email">✉️ {user?.email || 'student@skillswap.io'}</p>

              <div className="profile-stats-row">
                <div className="profile-mini-stat">
                  <span className="mini-stat-val">
                    ⭐ {exchangesCount > 0 ? ratingValue : `${ratingValue} (New)`}
                  </span>
                  <span className="mini-stat-lbl">Rating</span>
                </div>
                <div className="profile-mini-stat-divider"></div>
                <div className="profile-mini-stat">
                  <span className="mini-stat-val">
                    🤝 {exchangesCount}
                  </span>
                  <span className="mini-stat-lbl">Exchanges</span>
                </div>
              </div>

              <div className="profile-bio-box">
                <h4>About Me</h4>
                <p>
                  {user?.bio ||
                    'No bio added yet. Tell other students what you are studying and what skills you love to build!'}
                </p>
              </div>

              <button
                className={`btn ${isEditing ? 'btn-accent' : 'btn-outline'} btn-sm`}
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => (isEditing ? handleSave() : handleStartEditing())}
              >
                {isEditing ? '✓ Save Changes' : '✏️ Edit Profile'}
              </button>
            </div>
          </div>

          {/* Right Column: Manage Details & Skills */}
          <div className="profile-content">
            {isEditing && (
              <div className="profile-card profile-edit-form animate-fade-in-up">
                <h3 className="card-title">Edit Details</h3>
                <div className="edit-form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>University / College</label>
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="Your university or school"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Bio</label>
                    <textarea
                      rows="3"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell peers what you love to do..."
                    ></textarea>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                  >
                    ✓ Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Skills Offered Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3 className="card-title">
                    <span className="skill-dot dot-primary"></span> Skills I Offer (Can Teach)
                  </h3>
                  <p className="card-subtitle">Skills and topics you can share with other students</p>
                </div>
                <span className="badge badge-primary">{skillsOffered.length} Skills</span>
              </div>

              <div className="skills-badge-list">
                {skillsOffered.length > 0 ? (
                  skillsOffered.map((skill) => (
                    <span key={skill} className="skill-chip chip-primary">
                      {skill}
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => handleRemoveOffered(skill)}
                        title={`Remove ${skill}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No skills offered yet. Add a skill below to start exchanging!
                  </p>
                )}
              </div>

              <form className="add-skill-bar" onSubmit={handleAddOffered}>
                <input
                  type="text"
                  placeholder="Add a new skill you can teach (e.g. Tailwind, Python)..."
                  value={newOfferedSkill}
                  onChange={(e) => setNewOfferedSkill(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  + Add Skill
                </button>
              </form>
            </div>

            {/* Skills Wanted Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3 className="card-title">
                    <span className="skill-dot dot-secondary"></span> Skills I Want to Learn
                  </h3>
                  <p className="card-subtitle">Topics and abilities you want to acquire from peers</p>
                </div>
                <span className="badge badge-secondary">{skillsWanted.length} Skills</span>
              </div>

              <div className="skills-badge-list">
                {skillsWanted.length > 0 ? (
                  skillsWanted.map((skill) => (
                    <span key={skill} className="skill-chip chip-secondary">
                      {skill}
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => handleRemoveWanted(skill)}
                        title={`Remove ${skill}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No skills requested yet. Add skills you are interested in learning!
                  </p>
                )}
              </div>

              <form className="add-skill-bar" onSubmit={handleAddWanted}>
                <input
                  type="text"
                  placeholder="Add a skill you want to learn (e.g. Graphic Design, Figma)..."
                  value={newWantedSkill}
                  onChange={(e) => setNewWantedSkill(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  + Add Skill
                </button>
              </form>
            </div>

            {/* Real Student Achievements */}
            <div className="profile-card">
              <h3 className="card-title">Student Achievements</h3>
              <div className="achievements-grid">
                {exchangesCount >= 5 && Number(ratingValue) >= 4.8 ? (
                  <div className="achievement-pill">
                    <span className="achieve-icon">🌟</span>
                    <div>
                      <strong>Top Mentor</strong>
                      <small>High peer rating across 5+ exchanges</small>
                    </div>
                  </div>
                ) : exchangesCount > 0 ? (
                  <div className="achievement-pill">
                    <span className="achieve-icon">🤝</span>
                    <div>
                      <strong>Active Exchanger</strong>
                      <small>Completed {exchangesCount} verified exchange{exchangesCount > 1 ? 's' : ''}</small>
                    </div>
                  </div>
                ) : (
                  <div className="achievement-pill">
                    <span className="achieve-icon">🚀</span>
                    <div>
                      <strong>Community Explorer</strong>
                      <small>Ready to start first skill exchange</small>
                    </div>
                  </div>
                )}
                <div className="achievement-pill">
                  <span className="achieve-icon">⚡</span>
                  <div>
                    <strong>Fast Responder</strong>
                    <small>Active participant on SkillSwap</small>
                  </div>
                </div>
                <div className="achievement-pill">
                  <span className="achieve-icon">🎓</span>
                  <div>
                    <strong>Verified Campus</strong>
                    <small>{user?.university || 'University Member'}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
