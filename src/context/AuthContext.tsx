'use client'

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react'

interface User {
  userId: string
  email: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error('Failed to fetch session', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [])

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
    // The actual logout API call will be handled by the component that triggers it
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
