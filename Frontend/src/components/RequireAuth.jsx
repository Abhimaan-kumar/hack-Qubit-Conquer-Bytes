import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const RequireAuth = ({ children }) => {
  const location = useLocation()
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  
  return children
}

export default RequireAuth


