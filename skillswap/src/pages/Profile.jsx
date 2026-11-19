import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

export default function Profile() {
  const { user } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || 'Alex Johnson')
  const [university, setUniversity] = useState(user?.university || 'Stanford University')
  const [bio, setBio] = useState(
    user?.bio || 'Full-stack developer and lifelong learner. Always up for exchanging knowledge and meeting new people.'
  )
  const [skillsOffered, setSkillsOffered] = useState(user?.skillsOffered || ['React', 'Node.js', 'TypeScript'])
  const [skillsWanted, setSkillsWanted] = useState(user?.skillsWanted || ['Machine Learning', 'UI/UX Design', 'Photography'])

  const [newOfferedSkill, setNewOfferedSkill] = useState('')
  const [newWantedSkill, setNewWantedSkill] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleAddOffered = (e) => {
    e.preventDefault()
    if (!newOfferedSkill.trim()) return
    if (!skillsOffered.includes(newOfferedSkill.trim())) {
      setSkillsOffered([...skillsOffered, newOfferedSkill.trim()])
    }
    setNewOfferedSkill('')
  }

  const handleRemoveOffered = (skillToRemove) => {
    setSkillsOffered(skillsOffered.filter(s => s !== skillToRemove))
  }

  const handleAddWanted = (e) => {
    e.preventDefault()
    if (!newWantedSkill.trim()) return
    if (!skillsWanted.includes(newWantedSkill.trim())) {
      setSkillsWanted([...skillsWanted, newWantedSkill.trim()])
    }
    setNewWantedSkill('')
  }

  const handleRemoveWanted = (skillToRemove) => {
    setSkillsWanted(skillsWanted.filter(s => s !== skillToRemove))
  }

  const handleSave = () => {
    setIsEditing(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="profile-page page-container">
      <div className="container">
        {savedSuccess && (
          <div className="alert-success-banner animate-fade-in">
            ✓ Profile information saved successfully!
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

              <h2 className="profile-display-name">{name}</h2>
              <p className="profile-display-uni">🎓 {university}</p>
              <p className="profile-display-email">✉️ {user?.email || 'alex@skillswap.io'}</p>

              <div className="profile-stats-row">
                <div className="profile-mini-stat">
                  <span className="mini-stat-val">⭐ {user?.rating || 4.9}</span>
                  <span className="mini-stat-lbl">Rating</span>
                </div>
                <div className="profile-mini-stat-divider"></div>
                <div className="profile-mini-stat">
                  <span className="mini-stat-val">🤝 {user?.exchanges || 18}</span>
                  <span className="mini-stat-lbl">Exchanges</span>
                </div>
              </div>

              <div className="profile-bio-box">
                <h4>About Me</h4>
                <p>{bio}</p>
              </div>

              <button
                className={`btn ${isEditing ? 'btn-accent' : 'btn-outline'} btn-sm`}
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
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
                {skillsOffered.map((skill) => (
                  <span key={skill} className="skill-chip chip-primary">
                    {skill}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => handleRemoveOffered(skill)}
                      title="Remove skill"
                    >
                      ✕
                    </button>
                  </span>
                ))}
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
                {skillsWanted.map((skill) => (
                  <span key={skill} className="skill-chip chip-secondary">
                    {skill}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => handleRemoveWanted(skill)}
                      title="Remove skill"
                    >
                      ✕
                    </button>
                  </span>
                ))}
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

            {/* Reputation & Badges */}
            <div className="profile-card">
              <h3 className="card-title">Student Achievements</h3>
              <div className="achievements-grid">
                <div className="achievement-pill">
                  <span className="achieve-icon">🌟</span>
                  <div>
                    <strong>Top Mentor</strong>
                    <small>Completed 15+ high-rated exchanges</small>
                  </div>
                </div>
                <div className="achievement-pill">
                  <span className="achieve-icon">⚡</span>
                  <div>
                    <strong>Fast Responder</strong>
                    <small>Usually replies within 2 hours</small>
                  </div>
                </div>
                <div className="achievement-pill">
                  <span className="achieve-icon">🎓</span>
                  <div>
                    <strong>Verified Campus</strong>
                    <small>Stanford University student</small>
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
