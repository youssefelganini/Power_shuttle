import React from 'react'
import './RoleCard.css'

export default function RoleCard({ icon, title, desc, variant, onClick }) {
  return (
    <button className={'role-card role-card--' + variant} onClick={onClick}>
      <span className="role-card-icon">{icon}</span>
      <span className="role-card-title">{title}</span>
      <span className="role-card-desc">{desc}</span>
    </button>
  )
}
