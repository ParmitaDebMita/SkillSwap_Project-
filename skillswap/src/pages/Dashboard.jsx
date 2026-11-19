import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import StatCard from '../components/StatCard'
import RequestCard from '../components/RequestCard'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const { requests, students } = useData()

  const pendingReceived = requests.filter(r => r.type === 'received' && r.status === 'pending').length
  const totalExchanges = requests.filter(r => r.status === 'accepted').length
  const recentRequests = requests.slice(0, 3)

  const offeredList = user?.skillsOffered || ['React', 'Node.js', 'TypeScript']
  const wantedList = user?.skillsWanted || ['Machine Learning', 'UI/UX Design', 'Photography']

  return (
    <div className="dashboard page-container">
      <div className="container">
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, <span className="welcome-name">{user?.name?.split(' ')[0] || 'Friend'}</span> 👋
            </h1>
            <p className="welcome-subtitle">
              Here is an overview of your skill exchange activity. Keep learning and sharing!
            </p>
          </div>
          <Link to="/explore" className="btn btn-primary">
            Explore New Skills
          </Link>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          <StatCard icon="🤝" label="Total Exchanges" value={user?.exchanges || totalExchanges || 18} color="primary" />
          <StatCard icon="📩" label="Pending Requests" value={pendingReceived} color="secondary" />
          <StatCard icon="⭐" label="Your Rating" value={user?.rating || 4.9} color="accent" />
          <StatCard icon="👥" label="Community Size" value={students.length} color="primary" />
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
                  Skills You Offer
                </h3>
                <div className="skill-tags">
                  {offeredList.map(skill => (
                    <span key={skill} className="badge badge-primary">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-section">
                <h3 className="summary-heading">
                  <span className="summary-dot dot-secondary"></span>
                  Skills You Want
                </h3>
                <div className="skill-tags">
                  {wantedList.map(skill => (
                    <span key={skill} className="badge badge-secondary">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/profile" className="btn btn-outline btn-sm" style={{ marginTop: '16px' }}>
              Edit Profile
            </Link>
          </div>

          {/* Recent Requests */}
          <div className="dashboard-card">
            <div className="card-header-row">
              <h2 className="dashboard-card-title">Recent Requests</h2>
              <Link to="/requests" className="view-all-link">View All →</Link>
            </div>
            <div className="recent-requests">
              {recentRequests.length > 0 ? (
                recentRequests.map(req => (
                  <RequestCard key={req.id} request={req} />
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>No requests yet. Start exploring skills!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Matches */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Suggested Matches</h2>
          <p className="card-description">Students who have skills you want and want skills you offer.</p>
          <div className="matches-grid">
            {students
              .filter(s =>
                s.skillsOffered.some(skill => wantedList.includes(skill)) ||
                s.skillsWanted.some(skill => offeredList.includes(skill))
              )
              .slice(0, 4)
              .map(student => (
                <div key={student.id} className="match-card">
                  <span className="match-avatar">{student.avatar}</span>
                  <div className="match-info">
                    <strong>{student.name}</strong>
                    <small>{student.university}</small>
                  </div>
                  <div className="match-skills">
                    {student.skillsOffered
                      .filter(s => wantedList.includes(s))
                      .map(s => (
                        <span key={s} className="badge badge-accent">{s}</span>
                      ))}
                  </div>
                  <Link to="/explore" className="btn btn-outline btn-sm">View</Link>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
