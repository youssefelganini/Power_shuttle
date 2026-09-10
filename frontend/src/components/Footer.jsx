import React from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">POWER SHUTTLE</div>

        <div className="footer-links">
          <a href="mailto:hello@powershuttle.eg" className="footer-link">
            <span className="footer-icon-badge">
              <Mail size={20} />
            </span>
            <span>hello@powershuttle.eg</span>
          </a>
          <a
            href="https://wa.me/201000000000"
            className="footer-link"
            target="_blank"
            rel="noreferrer"
          >
            <span className="footer-icon-badge footer-icon-badge--whatsapp">
              <MessageCircle size={20} />
            </span>
            <span>WhatsApp</span>
          </a>
        </div>

        <div className="footer-copy">&copy; 2026 Power Shuttle. Built for the Egyptian used-car market.</div>
      </div>
    </footer>
  )
}
