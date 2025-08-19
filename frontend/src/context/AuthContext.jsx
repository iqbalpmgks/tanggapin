import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

const authReducer = (state, action) => {
  switch (action.type) {
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
        error: null
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token is still valid
      authService.verifyToken(token)
        .then(user => {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token }
          })
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
    }
  }, [])

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const response = await authService.login(credentials)
      localStorage.setItem('token', response.token)
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

  const logout = () => {
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    login,
    logout,
    clearError
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
