import api from './api'

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data
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

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Logout should work even if API call fails
      console.error('Logout API call failed:', error)
    }
  }
}
