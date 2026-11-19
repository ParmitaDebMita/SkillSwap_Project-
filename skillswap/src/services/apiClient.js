/**
 * SkillSwap API Client
 *
 * Base URL: http://localhost:8000/api (from VITE_API_URL or default)
 * JWT token is stored in localStorage key: skillswap_auth_token
 */

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:8000/api'

// ── Safe localStorage helpers ─────────────────────────────────────────────────

export function safeGetStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined || raw === 'undefined') return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
}

export function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken() {
  return safeGetStorage('skillswap_auth_token', null)
}

export function setToken(token) {
  safeSetStorage('skillswap_auth_token', token)
}

export function clearToken() {
  safeRemoveStorage('skillswap_auth_token')
}

// ── Core HTTP request wrapper ─────────────────────────────────────────────────
/**
 * Makes an authenticated HTTP request to the FastAPI backend.
 * - Automatically injects Bearer token if available.
 * - Returns { success: true, data } or { success: false, error, status }.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const config = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMessage =
        (data && (data.detail || data.message)) ||
        `Request failed with status ${response.status}`
      return { success: false, error: errorMessage, status: response.status }
    }

    return { success: true, data, status: response.status }
  } catch (networkError) {
    return {
      success: false,
      error: networkError.message || 'Network connection failed. Is the backend running?',
      isNetworkError: true,
    }
  }
}
