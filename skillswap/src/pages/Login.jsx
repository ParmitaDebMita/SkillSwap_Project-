import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const { login, loginAsDemo } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    const emailTrim = email.trim()
    const passTrim = password.trim()

    if (!emailTrim) {
      errs.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errs.email = 'Please enter a valid email address (e.g. name@university.edu)'
    }

    if (!passTrim) {
      errs.password = 'Password is required'
    } else if (passTrim.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const res = login(email, password)
    if (!res.success) {
      setErrors({ form: res.message })
      return
    }

    navigate('/dashboard')
  }

  const handleQuickDemo = (demoId, demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrors({})
    const res = loginAsDemo(demoId)
    if (res.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="auth-page page-container">
      <div className="auth-container">
        <div className="auth-visual">
          <div className="auth-visual-content">
            <span className="auth-visual-icon">👋</span>
            <h2>Welcome Back</h2>
            <p>Sign in to continue exchanging skills and learning with fellow campus peers.</p>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <h1 className="auth-title">Login</h1>
            <p className="auth-subtitle">Enter your credentials to access your account</p>

            <div className="demo-notice-banner">
              <strong>ℹ️ Demo Mode:</strong> Client-side simulated auth. Use any demo profile or sign up.
            </div>

            {errors.form && (
              <div className="form-alert-error animate-fade-in">
                ⚠️ {errors.form}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. alex@skillswap.io"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    if (errors.email || errors.form) {
                      setErrors(prev => ({ ...prev, email: '', form: '' }))
                    }
                  }}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (errors.password || errors.form) {
                      setErrors(prev => ({ ...prev, password: '', form: '' }))
                    }
                  }}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Sign In
              </button>
            </form>

            {/* Quick Demo Switcher for fast evaluation */}
            <div className="quick-demo-box">
              <span className="quick-demo-title">⚡ Instant Demo Login:</span>
              <div className="quick-demo-buttons">
                <button
                  type="button"
                  className="quick-demo-btn"
                  onClick={() => handleQuickDemo(0, 'alex@skillswap.io', 'password123')}
                >
                  🚀 User 1: Alex Johnson (Stanford)
                </button>
                <button
                  type="button"
                  className="quick-demo-btn"
                  onClick={() => handleQuickDemo(1, 'ananya@iitd.ac.in', 'password123')}
                >
                  👩‍💻 User 2: Ananya Sharma (IIT Delhi)
                </button>
              </div>
            </div>

            <p className="auth-switch">
              New to SkillSwap? <Link to="/signup">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
