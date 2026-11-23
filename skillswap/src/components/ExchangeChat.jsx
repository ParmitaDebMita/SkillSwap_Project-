import { useState, useEffect, useRef } from 'react'
import { chatService } from '../services/chatService'
import { useAuth } from '../hooks/useAuth'
import './ExchangeChat.css'

export default function ExchangeChat({ exchange, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const isReceived = exchange.toId === user?.id || exchange.to?.id === user?.id
  const peer = isReceived ? exchange.from : exchange.to

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load message history & poll for updates every 3 seconds
  useEffect(() => {
    let cancelled = false

    const fetchHistory = async () => {
      const res = await chatService.getMessages(exchange.id)
      if (!cancelled) {
        if (res.success) {
          setMessages(res.messages)
          setError('')
        } else {
          setError(res.error || 'Failed to load messages.')
        }
        setLoading(false)
      }
    }

    fetchHistory()
    const timer = setInterval(fetchHistory, 3000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [exchange.id])

  useEffect(() => {
    if (!loading) {
      scrollToBottom()
    }
  }, [messages, loading])

  const handleSend = async (e) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || sending) return

    setSending(true)
    const res = await chatService.sendMessage(exchange.id, trimmed)
    setSending(false)

    if (res.success) {
      setInputText('')
      setMessages((prev) => [...prev, res.message])
    } else {
      setError(res.error || 'Failed to send message.')
    }
  }

  const formatTimestamp = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="exchange-chat-overlay" onClick={onClose}>
      <div className="exchange-chat-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="exchange-chat-header">
          <div className="chat-peer-info">
            <span className="chat-peer-avatar">{peer?.avatar || '🎓'}</span>
            <div>
              <h4 className="chat-peer-name">{peer?.name || 'Peer'}</h4>
              <p className="chat-swap-badge">
                Swapping: <strong>{exchange.skillOffered}</strong> ⇄ <strong>{exchange.skillWanted}</strong>
              </p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose} aria-label="Close chat">
            ✕
          </button>
        </div>

        {/* Message List */}
        <div className="exchange-chat-body">
          {loading && (
            <div className="chat-status-msg">
              <span>⏳</span> Loading conversation…
            </div>
          )}

          {error && !loading && (
            <div className="chat-error-banner">⚠️ {error}</div>
          )}

          {!loading && messages.length === 0 && (
            <div className="chat-status-msg">
              <span style={{ fontSize: '2rem' }}>💬</span>
              <p>No messages yet. Send a greeting to start your learning exchange!</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id
            return (
              <div key={msg.id} className={`chat-message ${isMe ? 'message-out' : 'message-in'}`}>
                <div className="message-bubble">
                  <p className="message-text">{msg.text}</p>
                  <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form className="exchange-chat-input-bar" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !inputText.trim()}>
            {sending ? '…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
