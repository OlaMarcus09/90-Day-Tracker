import { useState } from 'react'
import { buildShareText, shareLinks } from '../lib/emoji'

export default function ShareProgress({ dayNumber, streak }) {
  const [copied, setCopied] = useState(false)
  const text = buildShareText(dayNumber, streak)
  const links = shareLinks(text)

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // User cancelled the share sheet — not an error, nothing to do.
      }
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mini-card">
      <p className="eyebrow">Share progress</p>
      <p style={{ fontSize: '0.9rem' }}>{text}</p>

      {typeof navigator !== 'undefined' && navigator.share && (
        <button type="button" className="primary-button" onClick={handleNativeShare}>
          Share
        </button>
      )}

      <div className="row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <a className="ghost-button" href={links.whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a className="ghost-button" href={links.twitter} target="_blank" rel="noreferrer">
          X / Twitter
        </a>
        <a className="ghost-button" href={links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a className="ghost-button" href={links.facebook} target="_blank" rel="noreferrer">
          Facebook
        </a>
        <button type="button" className="ghost-button" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy text'}
        </button>
      </div>

      <p className="muted" style={{ fontSize: '0.72rem' }}>
        Only your day count and streak are shared — never your goal or notes.
      </p>
    </div>
  )
}