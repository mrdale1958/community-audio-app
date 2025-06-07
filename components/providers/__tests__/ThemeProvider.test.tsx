import { render } from '@testing-library/react'
import { ThemeProvider } from '../ThemeProvider'
import { useMediaQuery } from '@mui/material'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'

// Mock Material-UI hooks and components
jest.mock('@mui/material', () => ({
  useMediaQuery: jest.fn(),
  CssBaseline: jest.fn(() => null)
}))

jest.mock('@mui/material/styles', () => ({
  createTheme: jest.fn(() => ({ palette: { mode: 'light' } })),
  ThemeProvider: jest.fn(({ children }) => children)
}))

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates light theme when user prefers light mode', () => {
    ;(useMediaQuery as jest.Mock).mockReturnValue(false)
    
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )

    expect(createTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        palette: expect.objectContaining({
          mode: 'light'
        })
      })
    )
  })

  it('creates dark theme when user prefers dark mode', () => {
    ;(useMediaQuery as jest.Mock).mockReturnValue(true)
    
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )

    expect(createTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        palette: expect.objectContaining({
          mode: 'dark'
        })
      })
    )
  })

  it('renders children with theme context', () => {
    const testChild = <div data-testid="test-child">Test Child</div>
    const { getByTestId } = render(
      <ThemeProvider>
        {testChild}
      </ThemeProvider>
    )

    expect(getByTestId('test-child')).toBeInTheDocument()
    expect(MuiThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: expect.any(Object),
        children: expect.anything()
      }),
      expect.any(Object)
    )
  })

  it('applies custom typography settings', () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )

    expect(createTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        typography: expect.objectContaining({
          fontFamily: 'Inter, sans-serif',
          h1: expect.objectContaining({ fontWeight: 600 }),
          h2: expect.objectContaining({ fontWeight: 600 }),
          h3: expect.objectContaining({ fontWeight: 500 })
        })
      })
    )
  })

  it('applies custom component styles', () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )

    expect(createTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        components: expect.objectContaining({
          MuiCard: expect.objectContaining({
            styleOverrides: expect.objectContaining({
              root: expect.objectContaining({
                borderRadius: 12
              })
            })
          }),
          MuiButton: expect.objectContaining({
            styleOverrides: expect.objectContaining({
              root: expect.objectContaining({
                textTransform: 'none',
                borderRadius: 8
              })
            })
          })
        })
      })
    )
  })
})
