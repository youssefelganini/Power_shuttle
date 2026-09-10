import React from 'react'
import { Sparkles, Wallet } from 'lucide-react'
import './AIHero.css'

export default function AIHero({ ai }) {
  if (!ai) return null

  const { estimatedValueEGP, overview, opinion } = ai

  return (
    <div className="ai-hero fade-in">
      <div className="ai-hero-header">
        <Sparkles size={20} />
        <span>AI Vehicle Report</span>
      </div>

      {estimatedValueEGP != null && (
        <div className="ai-hero-value">
          <Wallet size={22} />
          <div>
            <span className="ai-hero-value-label">Estimated Value</span>
            <span className="ai-hero-value-amount">EGP {estimatedValueEGP.toLocaleString()}</span>
          </div>
        </div>
      )}

      {overview && (
        <div className="ai-hero-block">
          <span className="ai-hero-block-label">AI Overview</span>
          <p className="ai-hero-overview">{overview}</p>
        </div>
      )}

      {opinion && (
        <div className="ai-hero-block ai-hero-opinion">
          <span className="ai-hero-block-label">AI Opinion</span>
          <p>{opinion}</p>
        </div>
      )}
    </div>
  )
}
