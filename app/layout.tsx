import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import Header from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Community Audio Recording Project',
  description: 'Collecting community voices, one name at a time',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main>
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}