import React, { useState } from 'react'
import { RotateCcw, Car } from 'lucide-react'
import RoleSwitchPanel from './RoleSwitchPanel.jsx'
import './Auth.css'

export default function AuthService({ goto, enterRole, onLogin, initialMode }) {
  const [mode, setMode] = useState(initialMode === 'signin' ? 'signin' : 'signup')
  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [centerName, setCenterName] = useState('')
  const [nationalId, setNationalId] = useState('')

  const handleIdChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 14)
    setNationalId(digitsOnly)
  }

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'signup') {
      if (nationalId.length !== 14) return
      onLogin({ name: centerName, email, role: 'service' }, 'service-portal')
    } else {
      const isEmail = identifier.includes('@')
      onLogin(
        { name: identifier, email: isEmail ? identifier : '', role: 'service' },
        'service-portal'
      )
    }
  }

  return (
    <div className="container auth-page fade-in">
      <button className="auth-back" onClick={() => goto('landing')}>
        <RotateCcw size={15} />
        Back to Home
      </button>

      <h2 className="auth-title">Service center access</h2>
      <p className="auth-sub">Business accounts are verified before repairs can be logged.</p>

      <div className="auth-layout">
        <div>
          <div className="auth-tabs">
            <button
              type="button"
              className={'auth-tab' + (mode === 'signup' ? ' auth-tab--active' : '')}
              onClick={() => setMode('signup')}
            >
              Register
            </button>
            <button
              type="button"
              className={'auth-tab' + (mode === 'signin' ? ' auth-tab--active' : '')}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
          </div>

          <form className="auth-card auth-card--service" onSubmit={submit}>
            {mode === 'signin' ? (
              <div className="field">
                <label>Email or Username <span className="required">*</span></label>
                <input
                  className="input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="workshop@example.com or username"
                  required
                />
              </div>
            ) : (
              <div className="field">
                <label>Username <span className="required">*</span></label>
                <input
                  className="input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alnasr_service"
                  required
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="field fade-in">
                <label>Email <span className="required">*</span></label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="workshop@example.com"
                  required
                />
              </div>
            )}

            <div className="field">
              <label>Password <span className="required">*</span></label>
              <input className="input" type="password" placeholder="********" required />
            </div>

            {mode === 'signup' && (
              <div className="fade-in">
                <div className="field">
                  <label>National ID Card Number <span className="required">*</span></label>
                  <input
                    className="input"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{14}"
                    value={nationalId}
                    onChange={handleIdChange}
                    placeholder="14-digit National ID"
                    required
                  />
                  <div className="auth-hint">{nationalId.length}/14 digits</div>
                </div>
                <div className="field">
                  <label>Maintenance Center Name <span className="required">*</span></label>
                  <input
                    className="input"
                    type="text"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="e.g. Al-Nasr Auto Service"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={mode === 'signup' && nationalId.length !== 14}
            >
              {mode === 'signup' ? 'Register' : 'Sign In'}
            </button>
          </form>
        </div>

        <RoleSwitchPanel
          variant="buyer"
          icon={<Car size={24} strokeWidth={2.2} />}
          title="Just checking a car?"
          desc="If you're buying a used car and want to see its history, the buyer account is the one you need."
          buttonLabel="Switch to Buyer"
          onClick={() => enterRole('buyer')}
        />
      </div>
    </div>
  )
}
