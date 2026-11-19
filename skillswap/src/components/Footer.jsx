import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span>⚡</span> SkillSwap
            </Link>
            <p className="footer-tagline">
              Exchange skills, grow together. Join a community of students helping each other learn and succeed.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to="/explore">Explore Skills</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/requests">Requests</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/">About Us</Link>
              <Link to="/">Contact</Link>
              <Link to="/">Careers</Link>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link to="/">Privacy Policy</Link>
              <Link to="/">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SkillSwap. Built with ❤️ for students everywhere.</p>
        </div>
      </div>
    </footer>
  )
}

