import React from 'react'
import './Auth.css'

export default function RoleSwitchPanel({ icon, title, desc, buttonLabel, onClick, variant }) {
  return (
    <div className={'role-switch role-switch--' + variant}>
      <span className="role-switch-icon">{icon}</span>
      <h3 className="role-switch-title">{title}</h3>
      <p className="role-switch-desc">{desc}</p>
      <button type="button" className="btn btn-outline role-switch-btn" onClick={onClick}>
        {buttonLabel}
      </button>
    </div>
  )
}
