import React, { useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Landing from './components/Landing.jsx'
import RoleChoose from './components/RoleChoose.jsx'
import AuthBuyer from './components/AuthBuyer.jsx'
import AuthService from './components/AuthService.jsx'
import BuyerPortal from './components/BuyerPortal.jsx'
import ServicePortal from './components/ServicePortal.jsx'
import './App.css'

const SESSION_KEY = 'ps_session'

// Where each role lands once it already has a session: buyer -> VIN search,
// service center -> the log-a-repair form (which starts with VIN entry).
const PORTAL_BY_ROLE = { buyer: 'buyer-portal', service: 'service-portal' }
const AUTH_BY_ROLE = { buyer: 'buyer-auth', service: 'service-auth' }

// Survives a page refresh, so "already signed in" stays true after F5.
// Wrapped: localStorage throws outright in some private-browsing modes.
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    // A session is only valid if we can tell which role it belongs to.
    return parsed && PORTAL_BY_ROLE[parsed.role] ? parsed : null
  } catch {
    return null
  }
}

function saveSession(user) {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* non-fatal - the session just won't outlive this tab */
  }
}

// view: 'landing' | 'role-choose' | 'buyer-auth' | 'service-auth' | 'buyer-portal' | 'service-portal'
export default function App() {
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState(loadSession) // { name, email, role }
  const [view, setView] = useState(() => {
    // Restored session? Drop straight into that role's portal, not the landing page.
    const existing = loadSession()
    return existing ? PORTAL_BY_ROLE[existing.role] : 'landing'
  })
  const [authIntent, setAuthIntent] = useState(null) // 'signin' | 'signup' | null

  const goto = (v) => setView(v)
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  const hasSessionFor = (role) => Boolean(user && user.role === role)

  // THE fix for the routing bug: every role icon/button goes through here instead
  // of hardcoding goto('buyer-auth'). An existing session skips the login screen
  // and lands on the VIN entry/search page directly.
  const enterRole = (role) => {
    if (hasSessionFor(role)) {
      goto(PORTAL_BY_ROLE[role])
      return
    }
    goto(AUTH_BY_ROLE[role] || 'landing')
  }

  // Navbar avatar: back to whatever portal the current session belongs to.
  const openMyPortal = () => {
    if (user) goto(PORTAL_BY_ROLE[user.role] || 'landing')
  }

  const openRoleChoose = (intent) => {
    // Already signed in - the Sign In / Sign Up buttons shouldn't re-prompt.
    if (user) {
      openMyPortal()
      return
    }
    setAuthIntent(intent)
    goto('role-choose')
  }

  const handleLogin = (userInfo, nextView) => {
    setUser(userInfo)
    saveSession(userInfo)
    goto(nextView)
  }

  const handleLogout = () => {
    setUser(null)
    saveSession(null)
    setAuthIntent(null)
    goto('landing')
  }

  return (
    <div className="app" data-theme={theme}>
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoHome={() => goto('landing')}
        onSignIn={() => openRoleChoose('signin')}
        onSignUp={() => openRoleChoose('signup')}
        user={user}
        onOpenPortal={openMyPortal}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {view === 'landing' && <Landing goto={goto} enterRole={enterRole} />}
        {view === 'role-choose' && <RoleChoose goto={goto} enterRole={enterRole} intent={authIntent} />}
        {view === 'buyer-auth' && (
          <AuthBuyer goto={goto} enterRole={enterRole} onLogin={handleLogin} initialMode={authIntent} />
        )}
        {view === 'service-auth' && (
          <AuthService goto={goto} enterRole={enterRole} onLogin={handleLogin} initialMode={authIntent} />
        )}
        {view === 'buyer-portal' && <BuyerPortal goto={goto} />}
        {view === 'service-portal' && <ServicePortal goto={goto} />}
      </main>

      <Footer />
    </div>
  )
}
