'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const basePath = process.env.NODE_ENV === 'production' ? '/readmyname/api/auth' : '/api/auth'
  return <SessionProvider basePath={basePath}>{children}</SessionProvider>
}