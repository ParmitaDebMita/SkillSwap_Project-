import { Link } from 'react-router-dom'
import { features, howItWorks } from '../data/mockData'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import './Landing.css'

export default function Landing() {
  const { isLoggedIn } = useAuth()
  const { students } = useData()

  // Real, dynamic metrics derived directly from application data
  const totalStudentsCount = students.length
  const uniqueUniversitiesCount = new Set(students.map(s => s.university).filter(Boolean)).size
  const uniqueSkillsCount = new Set(students.flatMap(s => s.skillsOffered || [])).size

  const countStudentsWithSkill = (skillName) => {
    return students.filter(s => s.skillsOffered?.includes(skillName)).length
  }

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">🎓 Built by Students, for Students</div>
            <h1 className="hero-title">
              Exchange Skills,<br />
              <span className="hero-gradient">Grow Together</span>
            </h1>
            <p className="hero-subtitle">
              SkillSwap connects university students who want to teach and learn from each other. 
              Teach what you are great at, master what you need, and build meaningful peer connections.
            </p>
            <div className="hero-actions">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" className="btn btn-primary btn-lg">
                    Go to Dashboard
                  </Link>
                  <Link to="/explore" className="btn btn-outline btn-lg">
                    Explore Skills
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    Login
                  </Link>
                </>
              )}
            </div>

            {/* Authentic platform stats */}
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">{totalStudentsCount}+</span>
                <span className="hero-stat-label">Peer Mentors</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">{uniqueSkillsCount}+</span>
                <span className="hero-stat-label">Skills Offered</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">{uniqueUniversitiesCount}+</span>
                <span className="hero-stat-label">Universities</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card hero-card-1">
              <span>🎨</span>
              <div>
                <strong>UI/UX Design</strong>
                <small>{countStudentsWithSkill('UI/UX Design') || 2} mentors teaching</small>
              </div>
            </div>
            <div className="hero-card hero-card-2">
              <span>⚛️</span>
              <div>
                <strong>React Development</strong>
                <small>{countStudentsWithSkill('React') || 3} mentors teaching</small>
              </div>
            </div>
            <div className="hero-card hero-card-3">
              <span>🤖</span>
              <div>
                <strong>Machine Learning</strong>
                <small>{countStudentsWithSkill('Machine Learning') || 2} mentors teaching</small>
              </div>
            </div>
            <div className="hero-card hero-card-4">
              <span>📸</span>
              <div>
                <strong>Photography</strong>
                <small>{countStudentsWithSkill('Photography') || 1} mentor teaching</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose SkillSwap?</h2>
            <p className="section-subtitle">
              Everything you need to learn new skills and share your expertise with fellow students.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <span className="feature-icon">{feature.icon}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Start exchanging skills in four simple steps.
            </p>
          </div>
          <div className="steps-grid">
            {howItWorks.map((item, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{item.step}</div>
                <span className="step-icon">{item.icon}</span>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-desc">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Start Swapping Skills?</h2>
            <p className="cta-subtitle">
              Join fellow students already learning and teaching on SkillSwap. It is 100% free.
            </p>
            {isLoggedIn ? (
              <Link to="/explore" className="btn btn-primary btn-lg">
                Browse Skills Now
              </Link>
            ) : (
              <Link to="/signup" className="btn btn-primary btn-lg">
                Create Your Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
