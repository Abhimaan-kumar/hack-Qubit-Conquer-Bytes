import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import apiClient from '../utils/api'

const RequireAuth = ({ children }) => {
  const location = useLocation()
  if (!apiClient.token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

export default RequireAuth


