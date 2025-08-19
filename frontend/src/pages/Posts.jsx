import React from 'react'
import { PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

const Posts = () => {
  // Mock data for now - will be replaced with real API calls
  const posts = [
    {
      id: 1,
      title: 'Summer Collection Launch',
      instagramId: '18123456789',
      keywords: ['summer', 'collection', 'new'],
      responses: 45,
      isActive: true,
      lastActivity: '2 hours ago',
    },
    {
      id: 2,
      title: 'Flash Sale - 50% Off',
      instagramId: '18987654321',
      keywords: ['sale', 'discount', 'price'],
      responses: 23,
      isActive: true,
      lastActivity: '5 hours ago',
    },
    {
      id: 3,
      title: 'New Arrivals Preview',
      instagramId: '18456789123',
      keywords: ['new', 'arrivals', 'preview'],
      responses: 12,
      isActive: false,
      lastActivity: '1 day ago',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your Instagram posts and auto-reply settings
          </p>
        </div>
        <button className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Post
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <div key={post.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  ID: {post.instagramId}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  post.isActive ? 'bg-green-400' : 'bg-gray-300'
                }`} />
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Cog6ToothIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Keywords */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-500">Responses: </span>
                  <span className="font-medium text-gray-900">{post.responses}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last activity: </span>
                  <span className="font-medium text-gray-900">{post.lastActivity}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`${
                  post.isActive ? 'status-success' : 'status-pending'
                }`}>
                  {post.isActive ? 'Active' : 'Inactive'}
                </span>
                <button className="text-sm text-primary-600 hover:text-primary-700">
                  Configure
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Post Card */}
        <div className="card border-dashed border-2 border-gray-300 hover:border-primary-400 transition-colors cursor-pointer">
          <div className="flex flex-col items-center justify-center py-12">
            <PlusIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Post</h3>
            <p className="text-sm text-gray-500 text-center">
              Connect an Instagram post to start auto-replying to comments
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How to add a post
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy the Instagram post URL from your business account</li>
                <li>Click "Add Post" and paste the URL</li>
                <li>Configure keywords and response messages</li>
                <li>Activate auto-reply for the post</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Posts
