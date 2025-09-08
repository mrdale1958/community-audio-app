'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Client-side detection of basePath
  const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/readmyname')
    ? '/readmyname/api/auth'
    : '/api/auth'
  
  return <SessionProvider basePath={basePath}>{children}</SessionProvider>
}