/**
 * SkillSwap API Client
 * 
 * Configured for seamless transition between Local Demo Mode (localStorage)
 * and future FastAPI + MongoDB backend endpoints.
 * 
 * FastAPI Backend Configuration:
 * - Base URL defaults to http://localhost:8000/api
 * - Set VITE_API_URL in .env to override
 */

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:8000/api'

// Helper for safe JSON storage access
export function safeGetStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined || raw === 'undefined') return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.warn(`[SkillSwap Storage] Error reading ${key}:`, err)
    return fallback
  }
}

export function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[SkillSwap Storage] Error saving ${key}:`, err)
  }
}

/**
 * Standard HTTP request wrapper prepared for FastAPI endpoints:
 * - Automatically injects Bearer token if available
 * - Handles JSON serialization and response parsing
 * - Standardized error formatting matching FastAPI HTTPExceptions
 */
export async function apiRequest(endpoint, options = {}) {
  const token = safeGetStorage('skillswap_auth_token', null)
  
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
      error: networkError.message || 'Network connection failed.',
      isNetworkError: true,
    }
  }
}
