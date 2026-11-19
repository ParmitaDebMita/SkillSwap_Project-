import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import './Navbar.css'
import { useState } from 'react'

export default function Navbar() {
  const { isLoggedIn, logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path) => (location.pathname === path ? 'nav-link active' : 'nav-link')

  const closeMobile = () => setMobileOpen(false)

  const handleLogout = () => {
    logout()
    closeMobile()
    navigate('/')
  }

  const handleAnchorClick = (e, targetId) => {
    closeMobile()
    if (location.pathname !== '/') {
      // Navigate to home first, then scroll
      navigate('/')
      setTimeout(() => {
        const el = document.getElementById(targetId)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      e.preventDefault()
      const el = document.getElementById(targetId)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo" onClick={closeMobile}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">SkillSwap</span>
        </Link>

        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-middle ${mobileOpen ? 'open' : ''}`}>
          <div className="nav-links">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className={isActive('/dashboard')} onClick={closeMobile}>
                  Dashboard
                </Link>
                <Link to="/explore" className={isActive('/explore')} onClick={closeMobile}>
                  Explore
                </Link>
                <Link to="/requests" className={isActive('/requests')} onClick={closeMobile}>
                  Requests
                </Link>
                <Link to="/profile" className={isActive('/profile')} onClick={closeMobile}>
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/explore" className={isActive('/explore')} onClick={closeMobile}>
                  Explore Skills
                </Link>
                <a
                  href="#features"
                  className="nav-link"
                  onClick={(e) => handleAnchorClick(e, 'features')}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="nav-link"
                  onClick={(e) => handleAnchorClick(e, 'how-it-works')}
                >
                  How It Works
                </a>
              </>
            )}
          </div>

          <div className="nav-actions">
            <ThemeToggle />
            {isLoggedIn ? (
              <div className="nav-user">
                <Link to="/profile" className="nav-avatar-btn" title="View Profile" onClick={closeMobile}>
                  <span className="nav-avatar">{user?.avatar || '🚀'}</span>
                  <span className="nav-user-name">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  Logout
                </button>
              </div>
            ) : (
              <div className="nav-auth">
                <Link to="/login" className="btn btn-outline btn-sm" onClick={closeMobile}>
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm" onClick={closeMobile}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
