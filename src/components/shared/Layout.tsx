import { type ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../providers/AuthProvider'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore'
import { toggleTheme } from '../../store/uiSlice'
import { Button } from './Button'
import { Avatar } from './Avatar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { profile, logout } = useAuthContext()
  const dispatch = useAppDispatch()
  const theme = useAppSelector((s) => s.ui.theme)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-text-secondary hover:text-text-primary dark:hover:text-text-primary-dark'

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border dark:border-border-dark bg-card dark:bg-card-dark sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" onClick={closeMenu} className="text-lg font-bold text-text-primary dark:text-text-primary-dark">
            KanbanDesk
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-sidebar dark:hover:bg-sidebar-dark transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <nav className="hidden md:flex items-center gap-4">
            <Link to="/dashboard" className={`text-sm font-medium transition-colors ${isActive('/dashboard')}`}>
              Boards
            </Link>
            <Link to="/profile" className={`text-sm font-medium transition-colors ${isActive('/profile')}`}>
              Profile
            </Link>
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg text-text-secondary hover:bg-sidebar dark:hover:bg-sidebar-dark transition-colors"
              title="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-2">
              <Avatar src={profile?.avatar_url} name={profile?.name} size="sm" />
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </nav>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border dark:border-border-dark bg-card dark:bg-card-dark px-4 py-3 space-y-3">
            <Link to="/dashboard" onClick={closeMenu} className={`block text-sm font-medium transition-colors ${isActive('/dashboard')}`}>
              Boards
            </Link>
            <Link to="/profile" onClick={closeMenu} className={`block text-sm font-medium transition-colors ${isActive('/profile')}`}>
              Profile
            </Link>
            <div className="flex items-center gap-3 pt-2 border-t border-border dark:border-border-dark">
              <button
                onClick={() => dispatch(toggleTheme())}
                className="p-2 rounded-lg text-text-secondary hover:bg-sidebar dark:hover:bg-sidebar-dark transition-colors"
                title="Toggle theme"
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              <Avatar src={profile?.avatar_url} name={profile?.name} size="sm" />
              <span className="flex-1 text-sm text-text-primary dark:text-text-primary-dark truncate">
                {profile?.name ?? 'User'}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}