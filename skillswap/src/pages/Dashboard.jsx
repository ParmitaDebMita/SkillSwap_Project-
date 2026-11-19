import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import StatCard from '../components/StatCard'
import RequestCard from '../components/RequestCard'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const { requests, students } = useData()

  // Actual statistics calculated dynamically from application data
  const pendingReceivedCount = requests.filter(
    r => (r.toId === user?.id || r.to?.id === user?.id) && r.status === 'pending'
  ).length

  const acceptedExchangesCount = requests.filter(
    r =>
      (r.fromId === user?.id ||
        r.from?.id === user?.id ||
        r.toId === user?.id ||
        r.to?.id === user?.id) &&
      r.status === 'accepted'
  ).length

  // Synchronized exchange count from actual accepted proposals and user record
  const totalExchanges = Math.max(user?.exchanges || 0, acceptedExchangesCount)

  // Clear, non-misleading rating indicator
  const displayRating =
    totalExchanges > 0
      ? (user?.rating !== undefined ? Number(user.rating).toFixed(1) : '5.0')
      : '5.0 (New)'

  // Community peers count excluding current user
  const communityCount = students.filter(s => s.id !== user?.id).length

  // Recent requests relevant to current student
  const recentUserRequests = requests
    .filter(
      r =>
        r.fromId === user?.id ||
        r.from?.id === user?.id ||
        r.toId === user?.id ||
        r.to?.id === user?.id
    )
    .slice(0, 3)

  const offeredList = user?.skillsOffered || []
  const wantedList = user?.skillsWanted || []

  // Suggested peer matches: Students who offer what you want, or want what you offer
  const suggestedMatches = students
    .filter(
      s =>
        s.id !== user?.id &&
        (s.skillsOffered?.some(skill => wantedList.includes(skill)) ||
          s.skillsWanted?.some(skill => offeredList.includes(skill)))
    )
    .slice(0, 4)

  return (
    <div className="dashboard page-container">
      <div className="container">
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, <span className="welcome-name">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
            </h1>
            <p className="welcome-subtitle">
              Here is an overview of your skill exchange activity. Keep learning and sharing!
            </p>
          </div>
          <Link to="/explore" className="btn btn-primary">
            Explore New Skills
          </Link>
        </div>

        {/* Live Synchronized Stats */}
        <div className="dashboard-stats">
          <StatCard
            icon="🤝"
            label="Total Exchanges"
            value={totalExchanges}
            color="primary"
          />
          <StatCard
            icon="📩"
            label="Pending Requests"
            value={pendingReceivedCount}
            color="secondary"
          />
          <StatCard
            icon="⭐"
            label="Student Rating"
            value={displayRating}
            color="accent"
          />
          <StatCard
            icon="👥"
            label="Community Peers"
            value={communityCount}
            color="primary"
          />
        </div>

        {/* Two column layout */}
        <div className="dashboard-grid">
          {/* Skill Summary */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">Your Skill Summary</h2>
            <div className="skill-summary">
              <div className="summary-section">
                <h3 className="summary-heading">
                  <span className="summary-dot dot-primary"></span>
                  Skills You Offer ({offeredList.length})
                </h3>
                <div className="skill-tags">
                  {offeredList.length > 0 ? (
                    offeredList.map(skill => (
                      <span key={skill} className="badge badge-primary">{skill}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No skills offered yet. Add them in your profile!
                    </span>
                  )}
                </div>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-section">
                <h3 className="summary-heading">
                  <span className="summary-dot dot-secondary"></span>
                  Skills You Want ({wantedList.length})
                </h3>
                <div className="skill-tags">
                  {wantedList.length > 0 ? (
                    wantedList.map(skill => (
                      <span key={skill} className="badge badge-secondary">{skill}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No learning skills listed yet.
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link to="/profile" className="btn btn-outline btn-sm" style={{ marginTop: '20px' }}>
              Edit Profile Skills
            </Link>
          </div>

          {/* Recent Requests */}
          <div className="dashboard-card">
            <div className="card-header-row">
              <h2 className="dashboard-card-title">Recent Requests</h2>
              <Link to="/requests" className="view-all-link">
                View All ({requests.filter(r => r.fromId === user?.id || r.from?.id === user?.id || r.toId === user?.id || r.to?.id === user?.id).length}) →
              </Link>
            </div>
            <div className="recent-requests">
              {recentUserRequests.length > 0 ? (
                recentUserRequests.map(req => (
                  <RequestCard key={req.id} request={req} />
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>No active exchange requests found. Find peers in Explore Skills!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Matches */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Suggested Peer Matches</h2>
          <p className="card-description">
            Students who teach what you want to learn or want what you teach.
          </p>
          <div className="matches-grid">
            {suggestedMatches.length > 0 ? (
              suggestedMatches.map(student => (
                <div key={student.id} className="match-card">
                  <span className="match-avatar">{student.avatar}</span>
                  <div className="match-info">
                    <strong>{student.name}</strong>
                    <small>{student.university}</small>
                  </div>
                  <div className="match-skills">
                    {student.skillsOffered
                      ?.filter(s => wantedList.includes(s))
                      .map(s => (
                        <span key={s} className="badge badge-accent">{s}</span>
                      ))}
                  </div>
                  <Link
                    to={`/explore?search=${encodeURIComponent(student.name)}`}
                    className="btn btn-outline btn-sm"
                    title={`View ${student.name}'s profile in Explore`}
                  >
                    View
                  </Link>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No direct matches at the moment. Browse all student skills in Explore Skills!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
