import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

/**
 * Custom hook that provides utility functions for authentication
 * @returns {Object} Authentication utility functions
 */
export const useAuthUtils = () => {
  const { updateUser, logout, refreshAuth } = useAuth()

  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user data
   */
  const updateProfile = useCallback(async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData)
      updateUser(updatedUser)
      return updatedUser
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile')
    }
  }, [updateUser])

  /**
   * Change user password
   * @param {Object} passwordData - Current and new password
   * @returns {Promise<void>}
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      await authService.changePassword(passwordData)
    } catch (error) {
      throw new Error(error.message || 'Failed to change password')
    }
  }, [])

  /**
   * Get current user data from server
   * @returns {Promise<Object>} Current user data
   */
  const getCurrentUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser()
      updateUser(user)
      return user
    } catch (error) {
      throw new Error(error.message || 'Failed to get current user')
    }
  }, [updateUser])

  /**
   * Logout user and clear all auth data
   * @returns {Promise<void>}
   */
  const logoutUser = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API call fails
      await logout()
    }
  }, [logout])

  /**
   * Manually refresh authentication token
   * @returns {Promise<boolean>} Success status
   */
  const refreshToken = useCallback(async () => {
    try {
      return await refreshAuth()
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }, [refreshAuth])

  /**
   * Check if user has specific permission/role
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether user has permission
   */
  const hasPermission = useCallback((permission) => {
    // This can be expanded based on your permission system
    // For now, just check if user is authenticated
    return !!permission
  }, [])

  /**
   * Format user display name
   * @param {Object} user - User object
   * @returns {string} Formatted display name
   */
  const getDisplayName = useCallback((user) => {
    if (!user) return 'Guest'
    return user.name || user.email || 'User'
  }, [])

  /**
   * Get user initials for avatar
   * @param {Object} user - User object
   * @returns {string} User initials
   */
  const getUserInitials = useCallback((user) => {
    if (!user) return 'G'
    
    if (user.name) {
      return user.name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    
    return 'U'
  }, [])

  return {
    updateProfile,
    changePassword,
    getCurrentUser,
    logoutUser,
    refreshToken,
    hasPermission,
    getDisplayName,
    getUserInitials
  }
}

export default useAuthUtils
