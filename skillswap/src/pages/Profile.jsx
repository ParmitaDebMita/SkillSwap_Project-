import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { moderationService } from '../services/moderationService'
import './Profile.css'

export default function Profile() {
  const { user, updateProfile, refreshUser } = useAuth()
  const { reloadStudents } = useData()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [newOfferedSkill, setNewOfferedSkill] = useState('')
  const [offeredLevel, setOfferedLevel] = useState('Intermediate')
  const [newWantedSkill, setNewWantedSkill] = useState('')
  const [wantedLevel, setWantedLevel] = useState('Beginner')
  const [newAvail, setNewAvail] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Blocked users list
  const [blockedUsers, setBlockedUsers] = useState([])
  const [unblockingId, setUnblockingId] = useState(null)

  // Load blocked users on mount
  useEffect(() => {
    moderationService.getBlockedUsers().then(setBlockedUsers)
  }, [])

  // Current user skills and availability derived directly from user object
  const skillsOffered = user?.skillsOffered || []
  const skillsWanted = user?.skillsWanted || []
  const availability = user?.availability || []
  const exchangesCount = user?.exchanges || 0
  const ratingValue = user?.rating !== undefined ? Number(user.rating).toFixed(1) : '5.0'

  const showSuccess = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleStartEditing = () => {
    setName(user?.name || '')
    setUniversity(user?.university || '')
    setBio(user?.bio || '')
    setSaveError('')
    setIsEditing(true)
  }

  const handleAddOffered = async (e) => {
    e.preventDefault()
    const clean = newOfferedSkill.trim()
    if (!clean) return
    const skillFormatted = clean.includes('(') ? clean : `${clean} (${offeredLevel})`
    if (skillsOffered.includes(skillFormatted)) {
      setNewOfferedSkill('')
      return
    }
    const nextSkills = [...skillsOffered, skillFormatted]
    await updateProfile({ skillsOffered: nextSkills })
    reloadStudents()
    setNewOfferedSkill('')
    showSuccess()
  }

  const handleRemoveOffered = async (skillToRemove) => {
    const nextSkills = skillsOffered.filter(s => s !== skillToRemove)
    await updateProfile({ skillsOffered: nextSkills })
    reloadStudents()
  }

  const handleAddWanted = async (e) => {
    e.preventDefault()
    const clean = newWantedSkill.trim()
    if (!clean) return
    const skillFormatted = clean.includes('(') ? clean : `${clean} (${wantedLevel})`
    if (skillsWanted.includes(skillFormatted)) {
      setNewWantedSkill('')
      return
    }
    const nextSkills = [...skillsWanted, skillFormatted]
    await updateProfile({ skillsWanted: nextSkills })
    reloadStudents()
    setNewWantedSkill('')
    showSuccess()
  }

  const handleRemoveWanted = async (skillToRemove) => {
    const nextSkills = skillsWanted.filter(s => s !== skillToRemove)
    await updateProfile({ skillsWanted: nextSkills })
    reloadStudents()
  }

  const handleAddAvail = async (e) => {
    e.preventDefault()
    const clean = newAvail.trim()
    if (!clean || availability.includes(clean)) {
      setNewAvail('')
      return
    }
    const nextAvail = [...availability, clean]
    await updateProfile({ availability: nextAvail })
    reloadStudents()
    setNewAvail('')
    showSuccess()
  }

  const handleRemoveAvail = async (availToRemove) => {
    const nextAvail = availability.filter(a => a !== availToRemove)
    await updateProfile({ availability: nextAvail })
    reloadStudents()
  }

  const handleUnblock = async (blockedUserId) => {
    setUnblockingId(blockedUserId)
    const res = await moderationService.unblockUser(blockedUserId)
    if (res.success) {
      setBlockedUsers(prev => prev.filter(u => u.id !== blockedUserId))
      if (refreshUser) await refreshUser()
      reloadStudents()
    }
    setUnblockingId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    const success = await updateProfile({
      name: name.trim() || user?.name || 'Student',
      university: university.trim() || 'University Student',
      bio: bio.trim(),
    })
    setSaving(false)

    if (success) {
      reloadStudents()
      setIsEditing(false)
      showSuccess()
    } else {
      setSaveError('Failed to save profile. Please try again.')
    }
  }

  // Parse skill label into name and level tag
  const renderSkillText = (skill) => {
    const match = skill.match(/^(.*?)\s*\((Beginner|Intermediate|Advanced)\)$/i)
    if (match) {
      return (
        <>
          <span>{match[1]}</span>
          <span className={`chip-level-badge level-${match[2].toLowerCase()}`}>{match[2]}</span>
        </>
      )
    }
    return <span>{skill}</span>
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

              {/* Availability Preview */}
              <div className="profile-avail-preview">
                <h4>Available Times</h4>
                {availability.length > 0 ? (
                  <div className="avail-preview-tags">
                    {availability.map((a) => (
                      <span key={a} className="avail-chip">🕒 {a}</span>
                    ))}
                  </div>
                ) : (
                  <p className="avail-empty-hint">No schedule set yet.</p>
                )}
              </div>

              <button
                className={`btn ${isEditing ? 'btn-accent' : 'btn-outline'} btn-sm`}
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => (isEditing ? handleSave() : handleStartEditing())}
                disabled={saving}
              >
                {saving ? '⏳ Saving…' : isEditing ? '✓ Save Changes' : '✏️ Edit Profile'}
              </button>
            </div>
          </div>

          {/* Right Column: Manage Details & Skills */}
          <div className="profile-content">
            {isEditing && (
              <div className="profile-card profile-edit-form animate-fade-in-up">
                <h3 className="card-title">Edit Details</h3>

                {saveError && (
                  <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '12px' }}>
                    ⚠️ {saveError}
                  </div>
                )}

                <div className="edit-form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      disabled={saving}
                    />
                  </div>
                  <div className="form-group">
                    <label>University / College</label>
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="Your university or school"
                      disabled={saving}
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Bio</label>
                    <textarea
                      rows="3"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell peers what you love to do..."
                      disabled={saving}
                    ></textarea>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? '⏳ Saving…' : '✓ Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Availability Management */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3 className="card-title">
                    <span className="skill-dot dot-primary"></span> My Availability & Schedule
                  </h3>
                  <p className="card-subtitle">Set days and time slots when you are free to exchange skills</p>
                </div>
                <span className="badge badge-primary">{availability.length} Slots</span>
              </div>

              <div className="skills-badge-list">
                {availability.length > 0 ? (
                  availability.map((avail) => (
                    <span key={avail} className="skill-chip chip-primary">
                      🕒 {avail}
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => handleRemoveAvail(avail)}
                        title={`Remove ${avail}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No availability set. Add time slots below (e.g. "Weekday Evenings", "Saturday 2-5 PM").
                  </p>
                )}
              </div>

              <form className="add-skill-bar" onSubmit={handleAddAvail}>
                <input
                  type="text"
                  placeholder="e.g. Weekdays after 5 PM, Weekends, Monday 2-4 PM..."
                  value={newAvail}
                  onChange={(e) => setNewAvail(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  + Add Availability
                </button>
              </form>
            </div>

            {/* Skills Offered Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3 className="card-title">
                    <span className="skill-dot dot-primary"></span> Skills I Offer (Can Teach)
                  </h3>
                  <p className="card-subtitle">Skills and proficiency level you can share with peers</p>
                </div>
                <span className="badge badge-primary">{skillsOffered.length} Skills</span>
              </div>

              <div className="skills-badge-list">
                {skillsOffered.length > 0 ? (
                  skillsOffered.map((skill) => (
                    <span key={skill} className="skill-chip chip-primary">
                      {renderSkillText(skill)}
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
                  placeholder="Skill name (e.g. Python, UI Design)..."
                  value={newOfferedSkill}
                  onChange={(e) => setNewOfferedSkill(e.target.value)}
                />
                <select
                  value={offeredLevel}
                  onChange={(e) => setOfferedLevel(e.target.value)}
                  className="skill-level-select"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
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
                  <p className="card-subtitle">Topics and target proficiency level you want to acquire</p>
                </div>
                <span className="badge badge-secondary">{skillsWanted.length} Skills</span>
              </div>

              <div className="skills-badge-list">
                {skillsWanted.length > 0 ? (
                  skillsWanted.map((skill) => (
                    <span key={skill} className="skill-chip chip-secondary">
                      {renderSkillText(skill)}
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
                  placeholder="Skill name (e.g. Machine Learning, Figma)..."
                  value={newWantedSkill}
                  onChange={(e) => setNewWantedSkill(e.target.value)}
                />
                <select
                  value={wantedLevel}
                  onChange={(e) => setWantedLevel(e.target.value)}
                  className="skill-level-select"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <button type="submit" className="btn btn-secondary btn-sm">
                  + Add Skill
                </button>
              </form>
            </div>

            {/* Blocked Users */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3 className="card-title">
                    <span className="skill-dot dot-secondary"></span> Blocked Users
                  </h3>
                  <p className="card-subtitle">Students you have blocked. Unblocking allows both sides to interact again.</p>
                </div>
                <span className="badge badge-warning">{blockedUsers.length} Blocked</span>
              </div>

              {blockedUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  You have not blocked anyone. Use the ⋮ menu on a student card to block.
                </p>
              ) : (
                <ul className="blocked-users-list">
                  {blockedUsers.map((u) => (
                    <li key={u.id} className="blocked-user-row">
                      <span className="blocked-user-avatar">{u.avatar || '🎓'}</span>
                      <div className="blocked-user-info">
                        <strong>{u.name}</strong>
                        {u.university && <small>{u.university}</small>}
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleUnblock(u.id)}
                        disabled={unblockingId === u.id}
                        title={`Unblock ${u.name}`}
                      >
                        {unblockingId === u.id ? '⏳ Unblocking…' : '🔓 Unblock'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
