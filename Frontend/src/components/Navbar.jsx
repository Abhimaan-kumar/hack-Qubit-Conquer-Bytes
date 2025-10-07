import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calculator, Upload, MessageCircle, BarChart3, BookOpen, Globe } from 'lucide-react'
import { translations } from '../data/translations'

const Navbar = ({ language, setLanguage }) => {
  const location = useLocation()
  const t = translations[language]

  const navItems = [
    { path: '/', icon: BookOpen, label: t.nav.home },
    { path: '/calculator', icon: Calculator, label: t.nav.calculator },
    { path: '/upload', icon: Upload, label: t.nav.upload },
    { path: '/assistant', icon: MessageCircle, label: t.nav.assistant },
    { path: '/comparison', icon: BarChart3, label: t.nav.comparison },
    { path: '/deductions', icon: BookOpen, label: t.nav.deductions },
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-800">{t.appName}</span>
          </Link>
          
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar