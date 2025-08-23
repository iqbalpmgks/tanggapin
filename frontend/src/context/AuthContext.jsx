import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

// Token storage utilities
const TOKEN_KEY = 'tanggapin_token'
const USER_KEY = 'tanggapin_user'
const TOKEN_EXPIRY_KEY = 'tanggapin_token_expiry'

const tokenStorage = {
  setToken: (token, expiresIn = 24 * 60 * 60 * 1000) => { // Default 24 hours
    const expiryTime = Date.now() + expiresIn
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
  },
  
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    
    if (!token || !expiry) return null
    
    if (Date.now() > parseInt(expiry)) {
      tokenStorage.clearToken()
      return null
    }
    
    return token
  },
  
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    localStorage.removeItem(USER_KEY)
  },
  
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  
  getUser: () => {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },
  
  isTokenExpiring: (thresholdMinutes = 5) => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return true
    
    const thresholdMs = thresholdMinutes * 60 * 1000
    return Date.now() > (parseInt(expiry) - thresholdMs)
  }
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'INIT_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      }
    case 'INIT_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      }
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        loading: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    default:
      return state
  }
}

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true, // Start with loading true for initial auth check
  error: null
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize authentication state on app load
  const initializeAuth = useCallback(async () => {
    dispatch({ type: 'INIT_START' })
    
    try {
      const token = tokenStorage.getToken()
      const user = tokenStorage.getUser()
      
      if (token && user) {
        // Verify token is still valid with the server
        const verifiedUser = await authService.verifyToken(token)
        
        dispatch({
          type: 'INIT_SUCCESS',
          payload: { user: verifiedUser, token }
        })
      } else {
        dispatch({ type: 'INIT_FAILURE' })
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      tokenStorage.clearToken()
      dispatch({ type: 'INIT_FAILURE' })
    }
  }, [])

  // Check for token expiration and refresh if needed
  const checkTokenExpiry = useCallback(async () => {
    if (!state.isAuthenticated || !state.token) return

    if (tokenStorage.isTokenExpiring()) {
      try {
        // Attempt to refresh token
        const response = await authService.refreshToken()
        if (response.token) {
          tokenStorage.setToken(response.token, response.expiresIn)
          tokenStorage.setUser(response.user)
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: response
          })
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        logout()
      }
    }
  }, [state.isAuthenticated, state.token])

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Set up token expiry checking
  useEffect(() => {
    if (!state.isAuthenticated) return

    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000) // Check every 5 minutes
    return () => clearInterval(interval)
  }, [state.isAuthenticated, checkTokenExpiry])

  // Handle visibility change to check auth when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isAuthenticated) {
        checkTokenExpiry()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state.isAuthenticated, checkTokenExpiry])

  const login = async (credentials, rememberMe = false) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      const response = await authService.login(credentials)
      
      // Set token expiry based on remember me option
      const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 1 day
      
      tokenStorage.setToken(response.token, expiresIn)
      tokenStorage.setUser(response.user)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response
      })
      
      return response
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      })
      throw error
    }
  }

  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      // Call logout API to invalidate token on server
      await authService.logout()
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local storage and state
      tokenStorage.clearToken()
      dispatch({ type: 'LOGOUT' })
    }
  }

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData }
    tokenStorage.setUser(updatedUser)
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const refreshAuth = async () => {
    if (!state.token) return false
    
    try {
      const response = await authService.refreshToken()
      if (response.token) {
        tokenStorage.setToken(response.token, response.expiresIn)
        tokenStorage.setUser(response.user)
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: response
        })
        return true
      }
    } catch (error) {
      console.error('Manual refresh failed:', error)
      logout()
    }
    return false
  }

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    clearError,
    refreshAuth,
    isTokenExpiring: () => tokenStorage.isTokenExpiring()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
