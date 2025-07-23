'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Link as MuiLink,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { PersonAdd } from '@mui/icons-material'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CONTRIBUTOR'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('') // Clear error when user types
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setError('')

    try {
      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)

      // Auto sign in after successful registration
      setTimeout(async () => {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        })
        
        if (result?.ok) {
          router.push('/dashboard')
          router.refresh()
        }
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box sx={{ marginTop: 8, textAlign: 'center' }}>
          <Paper elevation={3} sx={{ padding: 4 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Account created successfully!
            </Alert>
            <Typography variant="h6" gutterBottom>
              Welcome to the Community Audio Recording Project
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You'll be automatically signed in and redirected in a moment...
            </Typography>
          </Paper>
        </Box>
      </Container>
    )
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <PersonAdd sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography component="h1" variant="h4">
              Sign Up
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Join the Community Audio Recording Project
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              helperText="Minimum 6 characters"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                disabled={loading}
              >
                <MenuItem value="CONTRIBUTOR">Contributor</MenuItem>
                <MenuItem value="OBSERVER">Observer</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              size="large"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>

            <Box textAlign="center">
              <Typography variant="body2">
                Already have an account?{' '}
                <MuiLink component={Link} href="/auth/signin" underline="hover">
                  Sign in here
                </MuiLink>
              </Typography>
            </Box>

            <Box textAlign="center" sx={{ mt: 2 }}>
              <MuiLink component={Link} href="/" underline="hover" variant="body2">
                ← Back to Home
              </MuiLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}