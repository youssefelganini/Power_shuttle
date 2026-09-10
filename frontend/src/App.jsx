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

// view: 'landing' | 'role-choose' | 'buyer-auth' | 'service-auth' | 'buyer-portal' | 'service-portal'
export default function App() {
  const [theme, setTheme] = useState('light')
  const [view, setView] = useState('landing')
  const [user, setUser] = useState(null) // { name, email, role }
  const [authIntent, setAuthIntent] = useState(null) // 'signin' | 'signup' | null

  const goto = (v) => setView(v)
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  const openRoleChoose = (intent) => {
    setAuthIntent(intent)
    goto('role-choose')
  }

  const handleLogin = (userInfo, nextView) => {
    setUser(userInfo)
    goto(nextView)
  }

  const handleLogout = () => {
    setUser(null)
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
        onLogout={handleLogout}
      />

      <main className="app-main">
        {view === 'landing' && <Landing goto={goto} />}
        {view === 'role-choose' && <RoleChoose goto={goto} intent={authIntent} />}
        {view === 'buyer-auth' && (
          <AuthBuyer goto={goto} onLogin={handleLogin} initialMode={authIntent} />
        )}
        {view === 'service-auth' && (
          <AuthService goto={goto} onLogin={handleLogin} initialMode={authIntent} />
        )}
        {view === 'buyer-portal' && <BuyerPortal goto={goto} />}
        {view === 'service-portal' && <ServicePortal goto={goto} />}
      </main>

      <Footer />
    </div>
  )
}
