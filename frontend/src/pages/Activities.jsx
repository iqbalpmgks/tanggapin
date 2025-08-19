import React, { useState } from 'react'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

const Activities = () => {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data for now - will be replaced with real API calls
  const activities = [
    {
      id: 1,
      type: 'comment_reply',
      status: 'success',
      message: 'Auto-replied to comment from @sarah_jones',
      post: 'Summer Collection Launch',
      keyword: 'price',
      response: 'Hi! Check our website for current pricing: link.com',
      timestamp: '2024-01-15T10:30:00Z',
      responseTime: '1.2s',
    },
    {
      id: 2,
      type: 'dm_sent',
      status: 'success',
      message: 'Sent DM to @mike_wilson about product inquiry',
      post: 'Flash Sale - 50% Off',
      keyword: 'availability',
      response: 'Hi! Thanks for your interest. Here are the available sizes...',
      timestamp: '2024-01-15T10:25:00Z',
      responseTime: '0.8s',
    },
    {
      id: 3,
      type: 'fallback_comment',
      status: 'warning',
      message: 'Posted fallback comment (DM failed to private account)',
      post: 'New Arrivals Preview',
      keyword: 'info',
      response: 'Thanks for your comment! Please check our bio link for more info.',
      timestamp: '2024-01-15T10:20:00Z',
      responseTime: '2.1s',
    },
    {
      id: 4,
      type: 'comment_reply',
      status: 'error',
      message: 'Failed to reply to comment from @alex_brown',
      post: 'Summer Collection Launch',
      keyword: 'shipping',
      response: 'We offer free shipping on orders over $50!',
      timestamp: '2024-01-15T10:15:00Z',
      responseTime: 'N/A',
      error: 'Rate limit exceeded',
    },
    {
      id: 5,
      type: 'dm_sent',
      status: 'success',
      message: 'Sent DM to @lisa_garcia about size inquiry',
      post: 'Flash Sale - 50% Off',
      keyword: 'size',
      response: 'Hi! Here\'s our size guide: link.com/sizes',
      timestamp: '2024-01-15T10:10:00Z',
      responseTime: '1.5s',
    },
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'comment_reply':
        return ChatBubbleLeftRightIcon
      case 'dm_sent':
        return PaperAirplaneIcon
      case 'fallback_comment':
        return ExclamationTriangleIcon
      default:
        return ChatBubbleLeftRightIcon
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.status === filter
    const matchesSearch = activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.post.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor all auto-reply activities and their performance
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Activities</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Activities List */}
      <div className="card">
        <div className="space-y-6">
          {filteredActivities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start space-x-4 pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                <div className={`flex-shrink-0 p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'success' ? 'status-success' :
                      activity.status === 'warning' ? 'status-pending' : 'status-error'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Post:</span> {activity.post}
                    </div>
                    <div>
                      <span className="font-medium">Keyword:</span> {activity.keyword}
                    </div>
                    <div>
                      <span className="font-medium">Response Time:</span> {activity.responseTime}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {formatTime(activity.timestamp)}
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Response:</span> {activity.response}
                    </p>
                    {activity.error && (
                      <p className="text-sm text-red-600 mt-2">
                        <span className="font-medium">Error:</span> {activity.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Activities will appear here once auto-replies start working.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {activities.filter(a => a.status === 'success').length}
          </div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {activities.filter(a => a.status === 'warning').length}
          </div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {activities.filter(a => a.status === 'error').length}
          </div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            1.4s
          </div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </div>
      </div>
    </div>
  )
}

export default Activities
