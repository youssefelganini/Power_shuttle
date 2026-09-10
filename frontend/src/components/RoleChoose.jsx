import React from 'react'
import { Car, Wrench, RotateCcw } from 'lucide-react'
import RoleCard from './RoleCard.jsx'
import './Auth.css'
import './RoleChoose.css'

export default function RoleChoose({ goto, intent }) {
  const heading = intent === 'signup' ? 'Create an account as...' : 'Sign in as...'

  return (
    <div className="container role-choose fade-in">
      <button className="auth-back" onClick={() => goto('landing')}>
        <RotateCcw size={15} />
        Back to Home
      </button>

      <h2 className="auth-title">{heading}</h2>
      <p className="auth-sub">Tell us which kind of account you need.</p>

      <div className="role-choose-grid">
        <RoleCard
          variant="buyer"
          icon={<Car size={26} strokeWidth={2.2} />}
          title="I'm a Buyer"
          desc="Check a car's history before you buy"
          onClick={() => goto('buyer-auth')}
        />
        <RoleCard
          variant="service"
          icon={<Wrench size={26} strokeWidth={2.2} />}
          title="I'm a Service Center"
          desc="Log a repair for the registry"
          onClick={() => goto('service-auth')}
        />
      </div>
    </div>
  )
}
