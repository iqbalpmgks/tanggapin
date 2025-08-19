import React from 'react'
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

const Dashboard = () => {
  // Mock data for now - will be replaced with real API calls
  const stats = [
    {
      name: 'Total Replies',
      value: '1,234',
      icon: ChatBubbleLeftRightIcon,
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Active Posts',
      value: '23',
      icon: DocumentTextIcon,
      change: '+3',
      changeType: 'positive',
    },
    {
      name: 'Response Time',
      value: '2.3s',
      icon: ClockIcon,
      change: '-0.5s',
      changeType: 'positive',
    },
    {
      name: 'Success Rate',
      value: '94%',
      icon: CheckCircleIcon,
      change: '+2%',
      changeType: 'positive',
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'reply',
      message: 'Auto-replied to comment on "Summer Collection"',
      time: '2 minutes ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'dm',
      message: 'Sent DM to @user123 about product inquiry',
      time: '5 minutes ago',
      status: 'success',
    },
    {
      id: 3,
      type: 'fallback',
      message: 'Fallback comment posted on "New Arrivals"',
      time: '10 minutes ago',
      status: 'warning',
    },
    {
      id: 4,
      type: 'reply',
      message: 'Auto-replied to comment on "Flash Sale"',
      time: '15 minutes ago',
      status: 'success',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your Instagram auto-reply performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-400' :
                activity.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <div className={`flex-shrink-0 ${
                activity.status === 'success' ? 'status-success' :
                activity.status === 'warning' ? 'status-pending' : 'status-error'
              }`}>
                {activity.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Setup</h3>
          <div className="space-y-3">
            <button className="w-full btn-instagram">
              Connect Instagram Account
            </button>
            <button className="w-full btn-primary">
              Add New Post
            </button>
            <button className="w-full btn-secondary">
              Configure Keywords
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Instagram Connection</span>
              <span className="status-success">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Webhook Status</span>
              <span className="status-success">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Auto-Reply</span>
              <span className="status-success">Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
