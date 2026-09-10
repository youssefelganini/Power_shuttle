import React from 'react'
import { Car, Wrench, ScanLine, Cpu, ShieldCheck } from 'lucide-react'
import RoleCard from './RoleCard.jsx'
import './Landing.css'

const STEPS = [
  { icon: <ScanLine size={20} />, text: 'Enter a car\u2019s VIN to pull its logged history' },
  { icon: <Cpu size={20} />, text: 'Our AI cross-checks every repair against the Egyptian market' },
  { icon: <ShieldCheck size={20} />, text: 'You get a plain-language verdict before you pay' },
]

export default function Landing({ goto, enterRole }) {
  return (
    <div className="fade-in">
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Know a used car&rsquo;s real story before you hand over the cash.
          </h1>
          <p className="hero-sub">
            Power Shuttle brings AI-backed transparency to Egypt&rsquo;s used-car market. Every repair is
            logged by the shop that did the work, then checked against real market data &mdash; so buyers
            stop guessing and service centers get credit for honest records.
          </p>

          <div className="hero-steps">
            {STEPS.map((s, i) => (
              <div className="hero-step" key={i}>
                <span className="hero-step-icon">{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="roles" id="roles">
        <div className="container roles-grid">
          <RoleCard
            variant="buyer"
            icon={<Car size={26} strokeWidth={2.2} />}
            title="I'm Buying a Car"
            desc="Check a car's history before you buy"
            onClick={() => enterRole('buyer')}
          />
          <RoleCard
            variant="service"
            icon={<Wrench size={26} strokeWidth={2.2} />}
            title="I'm a Service Center"
            desc="Log a repair for the registry"
            onClick={() => enterRole('service')}
          />
        </div>
      </section>
    </div>
  )
}
