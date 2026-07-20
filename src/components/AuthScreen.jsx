import { useState } from 'react'
import { useAuth } from '../state/useAuth'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signIn') // 'signIn' | 'signUp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  const isSignUp = mode === 'signUp'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (isSignUp) {
        await signUp({ email, password, fullName })
        setConfirmSent(true)
      } else {
        await signIn({ email, password })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmSent) {
    return (
      <div className="layout">
        <div className="card" style={{ marginTop: '3rem', textAlign: 'center' }}>
          <p className="eyebrow">Almost there</p>
          <h1 style={{ fontSize: '1.3rem', marginTop: '0.4rem' }}>Check your email 📬</h1>
          <p className="muted" style={{ marginTop: '0.6rem' }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back here to sign in.
          </p>
          <button className="ghost-button" style={{ marginTop: '1.2rem' }} onClick={() => setConfirmSent(false)}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="layout">
      <div style={{ marginTop: '2.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <p className="eyebrow">Compound</p>
        <h1 style={{ fontSize: '1.6rem', marginTop: '0.3rem' }}>
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        {isSignUp && (
          <label>
            Name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Marcus"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />
        </label>

        {error && (
          <p style={{ color: '#c97b6a', fontSize: '0.85rem' }}>{error}</p>
        )}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <button
        className="ghost-button"
        style={{ marginTop: '0.9rem' }}
        onClick={() => {
          setMode(isSignUp ? 'signIn' : 'signUp')
          setError('')
        }}
      >
        {isSignUp ? 'Already have an account? Sign in' : "New here? Create an account"}
      </button>
    </div>
  )
}