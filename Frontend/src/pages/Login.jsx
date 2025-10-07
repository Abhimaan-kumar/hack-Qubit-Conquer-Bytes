import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../utils/api'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await apiClient.login({ email, password })
      
      if (response.success && response.token) {
        apiClient.setAuthToken(response.token)
        toast.success('Logged in successfully!')
        
        // Store user data if needed
        if (response.data && response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <LogIn className="h-6 w-6 text-blue-600 mr-2" />
          Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login


