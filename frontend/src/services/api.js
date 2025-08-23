import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Token storage keys
const TOKEN_KEY = 'tanggapin_token'
const TOKEN_EXPIRY_KEY = 'tanggapin_token_expiry'
const USER_KEY = 'tanggapin_user'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper function to get valid token
const getValidToken = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  
  if (!token || !expiry) return null
  
  if (Date.now() > parseInt(expiry)) {
    // Token expired, clear storage
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    localStorage.removeItem(USER_KEY)
    return null
  }
  
  return token
}

// Helper function to clear auth data
const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  localStorage.removeItem(USER_KEY)
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getValidToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Try to refresh token
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${getValidToken()}`
          }
        })
        
        if (refreshResponse.data.token) {
          const { token, expiresIn = 24 * 60 * 60 * 1000 } = refreshResponse.data
          const expiryTime = Date.now() + expiresIn
          
          localStorage.setItem(TOKEN_KEY, token)
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }
      
      // If refresh fails or no token, clear auth and redirect
      clearAuthData()
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // Handle other error statuses
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data?.message)
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data?.message)
    }
    
    return Promise.reject(error)
  }
)

// Add request/response logging in development
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
      return config
    }
  )
  
  api.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`)
      return response
    },
    (error) => {
      console.log(`❌ API Error: ${error.response?.status} ${error.config?.url}`)
      return Promise.reject(error)
    }
  )
}

export default api
