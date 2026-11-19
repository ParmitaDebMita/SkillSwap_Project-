import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    const nameTrim = name.trim()
    const emailTrim = email.trim()
    const passTrim = password.trim()

    if (!nameTrim) {
      errs.name = 'Full name is required'
    } else if (nameTrim.length < 2) {
      errs.name = 'Name must be at least 2 characters long'
    }

    if (!emailTrim) {
      errs.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errs.email = 'Please enter a valid email address (e.g. name@university.edu)'
    }

    if (!passTrim) {
      errs.password = 'Password is required'
    } else if (passTrim.length < 6) {
      errs.password = 'Password must be at least 6 characters long'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setErrors({})

    const res = await signup(name, email, password)
    setSubmitting(false)

    if (!res.success) {
      setErrors({ form: res.message })
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="auth-page page-container">
      <div className="auth-container">
        <div className="auth-visual">
          <div className="auth-visual-content">
            <span className="auth-visual-icon">🚀</span>
            <h2>Join SkillSwap</h2>
            <p>Start your journey of learning and sharing skills with fellow students around the world.</p>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Sign up to start exchanging skills</p>

            {errors.form && (
              <div className="form-alert-error animate-fade-in">
                ⚠️ {errors.form}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    if (errors.name || errors.form) {
                      setErrors(prev => ({ ...prev, name: '', form: '' }))
                    }
                  }}
                  className={errors.name ? 'error' : ''}
                  disabled={submitting}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    if (errors.email || errors.form) {
                      setErrors(prev => ({ ...prev, email: '', form: '' }))
                    }
                  }}
                  className={errors.email ? 'error' : ''}
                  disabled={submitting}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a password (min 6 chars)"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (errors.password || errors.form) {
                      setErrors(prev => ({ ...prev, password: '', form: '' }))
                    }
                  }}
                  className={errors.password ? 'error' : ''}
                  disabled={submitting}
                />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? '⏳ Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
