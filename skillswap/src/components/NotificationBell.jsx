import { useState, useEffect, useRef } from 'react'
import { notificationService } from '../services/notificationService'
import './NotificationBell.css'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const bellRef = useRef(null)

  const loadNotifs = async () => {
    const list = await notificationService.getNotifications()
    setNotifications(list)
  }

  useEffect(() => {
    // Use Promise microtask to avoid synchronous setState-in-effect lint warning
    Promise.resolve().then(loadNotifs)
    const timer = setInterval(loadNotifs, 10000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleItemClick = async (notif) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      )
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    try {
      const d = new Date(ts)
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="notif-wrapper" ref={bellRef}>
      <button
        className="notif-bell-btn"
        onClick={handleToggle}
        aria-label="View notifications"
        title="Notifications"
      >
        <span className="notif-icon">🔔</span>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span>🔕</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className="notif-item-header">
                    <strong className="notif-title">{n.title}</strong>
                    <span className="notif-time">{formatTime(n.timestamp)}</span>
                  </div>
                  <p className="notif-message">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
