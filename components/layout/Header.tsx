'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Chip,
  Divider
} from '@mui/material'
import {
  AccountCircle,
  Dashboard,
  Mic,
  Upload,
  PlayArrow,
  Settings,
  Logout,
  Home
} from '@mui/icons-material'
import Link from 'next/link'

export default function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = async () => {
    handleMenuClose()
    await signOut({ callbackUrl: '/' })
  }

  const getRoleColor = (role?: string) => {
    if (!role) return 'default'
    switch (role) {
      case 'ADMIN': return 'error'
      case 'MANAGER': return 'warning'
      case 'CONTRIBUTOR': return 'primary'
      case 'OBSERVER': return 'info'
      default: return 'default'
    }
  }

  const isMenuOpen = Boolean(anchorEl)

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* Logo/Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            component={Link}
            href="/"
            sx={{ mr: 2 }}
          >
            <Home />
          </IconButton>
          <Typography 
            variant="h6" 
            component={Link} 
            href="/"
            sx={{ 
              textDecoration: 'none', 
              color: 'inherit',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Community Audio Recording
          </Typography>
        </Box>

        {/* Navigation - Show based on role */}
        {status === 'authenticated' && (session?.user?.role === 'CONTRIBUTOR' || session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN') && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
            <Button 
              color="inherit" 
              component={Link} 
              href="/contribute/live"
              startIcon={<Mic />}
              sx={{ mr: 1 }}
            >
              Record
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              href="/contribute/offline"
              startIcon={<Upload />}
              sx={{ mr: 1 }}
            >
              Upload
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              href="/playback"
              startIcon={<PlayArrow />}
              sx={{ mr: 1 }}
            >
              Listen
            </Button>
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
              <Button 
                color="inherit" 
                component={Link} 
                href="/manage"
                startIcon={<Settings />}
                sx={{ mr: 1 }}
              >
                Manage
              </Button>
            )}
          </Box>
        )}

        {/* User Menu */}
        {status === 'loading' && (
          <Typography variant="body2" color="inherit">
            Loading...
          </Typography>
        )}

        {status === 'unauthenticated' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit" 
              component={Link} 
              href="/auth/signin"
              variant="outlined"
              sx={{ borderColor: 'white', '&:hover': { borderColor: 'grey.300' } }}
            >
              Sign In
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              href="/auth/signup"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
              }}
            >
              Sign Up
            </Button>
          </Box>
        )}

        {status === 'authenticated' && session?.user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', mr: 2 }}>
              <Chip
                label={session.user.role || 'USER'}
                size="small"
                color={getRoleColor(session.user.role)}
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" sx={{ mr: 1 }}>
                {session.user.name}
              </Typography>
            </Box>
            
            <IconButton
              size="large"
              edge="end"
              onClick={handleMenuOpen}
              color="inherit"
              aria-label="account menu"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {session.user.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  minWidth: 200,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">{session.user.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.user.email}
                </Typography>
                <Chip
                  label={session.user.role || 'USER'}
                  size="small"
                  color={getRoleColor(session.user.role)}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Divider />
              
              <MenuItem onClick={() => router.push('/dashboard')}>
                <Dashboard sx={{ mr: 1 }} />
                Dashboard
              </MenuItem>
              
              <MenuItem onClick={() => router.push('/dashboard/recordings')}>
                <Mic sx={{ mr: 1 }} />
                My Recordings
              </MenuItem>

              {/* Mobile navigation items */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Divider />
                <MenuItem onClick={() => router.push('/contribute/live')}>
                  <Mic sx={{ mr: 1 }} />
                  Live Recording
                </MenuItem>
                <MenuItem onClick={() => router.push('/contribute/offline')}>
                  <Upload sx={{ mr: 1 }} />
                  Upload Recording
                </MenuItem>
                <MenuItem onClick={() => router.push('/playback')}>
                  <PlayArrow sx={{ mr: 1 }} />
                  Listen
                </MenuItem>
                {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
                  <MenuItem onClick={() => router.push('/manage')}>
                    <Settings sx={{ mr: 1 }} />
                    Manage
                  </MenuItem>
                )}
              </Box>
              
              <Divider />
              <MenuItem onClick={handleSignOut}>
                <Logout sx={{ mr: 1 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}