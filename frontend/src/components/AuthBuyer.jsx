import React, { useState } from 'react'
import { RotateCcw, Wrench } from 'lucide-react'
import RoleSwitchPanel from './RoleSwitchPanel.jsx'
import './Auth.css'

export default function AuthBuyer({ goto, enterRole, onLogin, initialMode }) {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'signin')
  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'signin') {
      const isEmail = identifier.includes('@')
      onLogin(
        { name: identifier, email: isEmail ? identifier : '', role: 'buyer' },
        'buyer-portal'
      )
    } else {
      onLogin({ name: username, email, role: 'buyer' }, 'buyer-portal')
    }
  }

  const handleGoogle = () => {
    onLogin({ name: 'Google User', email: 'user@gmail.com', role: 'buyer' }, 'buyer-portal')
  }

  return (
    <div className="container auth-page fade-in">
      <button className="auth-back" onClick={() => goto('landing')}>
        <RotateCcw size={15} />
        Back to Home
      </button>

      <h2 className="auth-title">{mode === 'signup' ? 'Create your account' : 'Sign in to check a car'}</h2>
      <p className="auth-sub">Free to use. No commitment.</p>

      <div className="auth-layout">
        <div>
          <div className="auth-tabs">
            <button
              type="button"
              className={'auth-tab' + (mode === 'signin' ? ' auth-tab--active' : '')}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={'auth-tab' + (mode === 'signup' ? ' auth-tab--active' : '')}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-card auth-card--buyer" onSubmit={submit}>
            {mode === 'signin' ? (
              <div className="field">
                <label>Email or Username <span className="required">*</span></label>
                <input
                  className="input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com or your username"
                  required
                />
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Username <span className="required">*</span></label>
                  <input
                    className="input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. karim_g"
                    required
                  />
                </div>
                <div className="field">
                  <label>Email <span className="required">*</span></label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </>
            )}

            <div className="field">
              <label>Password <span className="required">*</span></label>
              <input className="input" type="password" placeholder="********" required />
            </div>
            {mode === 'signup' && (
              <div className="field fade-in">
                <label>Confirm Password <span className="required">*</span></label>
                <input className="input" type="password" placeholder="********" required />
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit">
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <span className="auth-divider-line" />
            </div>

            <button type="button" className="btn btn-outline auth-google-btn" onClick={handleGoogle}>
              <span className="auth-google-badge">G</span>
              Continue with Google
            </button>
          </form>
        </div>

        <RoleSwitchPanel
          variant="service"
          icon={<Wrench size={24} strokeWidth={2.2} />}
          title="Meant to log a repair?"
          desc="If you run a service center and want to add a repair to the registry, head to the business account instead."
          buttonLabel="Switch to Service Center"
          onClick={() => enterRole('service')}
        />
      </div>
    </div>
  )
}
