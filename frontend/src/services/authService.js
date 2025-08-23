import api from './api'

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      return {
        user: response.data.user,
        token: response.data.token,
        expiresIn: response.data.expiresIn || 24 * 60 * 60 * 1000 // Default 24 hours
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  },

  async verifyToken(token) {
    try {
      const response = await api.get('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.user
    } catch (error) {
      throw new Error('Token verification failed')
    }
  },

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh')
      return {
        user: response.data.user,
        token: response.data.token,
        expiresIn: response.data.expiresIn || 24 * 60 * 60 * 1000
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Token refresh failed')
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Logout should work even if API call fails
      console.error('Logout API call failed:', error)
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data.user
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get current user')
    }
  },

  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/profile', userData)
      return response.data.user
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile')
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', passwordData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password')
    }
  }
}
