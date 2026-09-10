import React from 'react'
import { Car, Sun, Moon } from 'lucide-react'
import './Navbar.css'

export default function Navbar({ theme, onToggleTheme, onGoHome, onSignIn, onSignUp, user, onLogout }) {
  const initial = user ? user.name.trim().charAt(0).toUpperCase() : ''

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <button className="navbar-logo" onClick={onGoHome} aria-label="Go to homepage">
          <span className="navbar-logo-badge">
            <Car size={20} strokeWidth={2.4} />
          </span>
          <span className="navbar-logo-text">POWER SHUTTLE</span>
        </button>

        <div className="navbar-actions">
          <button className="navbar-theme-btn" onClick={onToggleTheme} aria-label="Toggle dark mode">
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>

          {user ? (
            <>
              <div className={'navbar-account' + (user.role === 'service' ? ' navbar-account--service' : '')}>
                <span className="navbar-avatar">{initial}</span>
                <span className="navbar-account-text">
                  <span className="navbar-account-name">{user.name}</span>
                  {user.email && <span className="navbar-account-email">{user.email}</span>}
                </span>
              </div>
              <button className="btn btn-outline" onClick={onLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={onSignIn}>
                Sign In
              </button>
              <button className="btn btn-primary" onClick={onSignUp}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
