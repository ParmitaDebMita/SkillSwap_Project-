import { Link } from 'react-router-dom'
import { features, howItWorks } from '../data/mockData'
import './Landing.css'

export default function Landing() {
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
            <div className="hero-badge">🎓 Built for Students</div>
            <h1 className="hero-title">
              Exchange Skills,<br />
              <span className="hero-gradient">Grow Together</span>
            </h1>
            <p className="hero-subtitle">
              SkillSwap connects students who want to teach and learn from each other. 
              Offer what you know, discover what you need, and build meaningful connections along the way.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Login
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">500+</span>
                <span className="hero-stat-label">Active Students</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">1,200+</span>
                <span className="hero-stat-label">Skills Exchanged</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">50+</span>
                <span className="hero-stat-label">Universities</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card hero-card-1">
              <span>🎨</span>
              <div>
                <strong>UI/UX Design</strong>
                <small>12 students offering</small>
              </div>
            </div>
            <div className="hero-card hero-card-2">
              <span>⚛️</span>
              <div>
                <strong>React Development</strong>
                <small>18 students offering</small>
              </div>
            </div>
            <div className="hero-card hero-card-3">
              <span>🤖</span>
              <div>
                <strong>Machine Learning</strong>
                <small>9 students offering</small>
              </div>
            </div>
            <div className="hero-card hero-card-4">
              <span>📸</span>
              <div>
                <strong>Photography</strong>
                <small>7 students offering</small>
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
              Join hundreds of students already learning and teaching on SkillSwap. It is completely free.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Create Your Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

