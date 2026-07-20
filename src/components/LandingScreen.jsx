const PHASES = [
  { name: 'Foundation', range: 'Days 1–30', copy: 'Show up every day and lay the groundwork. The hardest part is starting.', phase: 'foundation' },
  { name: 'Momentum', range: 'Days 31–60', copy: 'The habit takes hold. Effort starts to feel lighter as the routine sticks.', phase: 'momentum' },
  { name: 'Compound', range: 'Days 61–90', copy: 'Small daily wins stack up into change you can actually see and feel.', phase: 'compound' },
]

const STEPS = [
  { n: '1', title: 'Set your goal', copy: 'One clear 90-day outcome and 3–5 daily nonnegotiables.' },
  { n: '2', title: 'Show up daily', copy: 'Check off your list. Build a streak. Miss a day? A freeze has your back.' },
  { n: '3', title: 'Do it with a team', copy: 'Invite a partner or group. See each other’s progress and keep each other honest.' },
]

export default function LandingScreen({ onGetStarted }) {
  return (
    <main className="layout landing">
      <header className="landing-hero">
        <p className="eyebrow">Compound</p>
        <h1>90 days to compound small wins into big change.</h1>
        <p className="muted">
          Pick one goal. Show up daily. Bring a team along so you actually finish.
        </p>
        <button type="button" className="primary-button landing-cta" onClick={onGetStarted}>
          Get started
        </button>
      </header>

      <section className="landing-section">
        <p className="eyebrow">Three phases</p>
        <div className="stack">
          {PHASES.map((phase) => (
            <div className="card" key={phase.name}>
              <p className="eyebrow" data-phase={phase.phase}>{phase.range}</p>
              <h2 style={{ fontSize: '1.15rem' }}>{phase.name}</h2>
              <p className="muted" style={{ fontSize: '0.9rem' }}>{phase.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <p className="eyebrow">How it works</p>
        <div className="stack">
          {STEPS.map((step) => (
            <div className="mini-card landing-step" key={step.n}>
              <span className="landing-step-num" aria-hidden="true">{step.n}</span>
              <div>
                <strong>{step.title}</strong>
                <p className="muted" style={{ fontSize: '0.85rem' }}>{step.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.2rem' }}>Ready to start your 90 days?</h2>
        <button type="button" className="primary-button landing-cta" onClick={onGetStarted}>
          Get started
        </button>
      </section>
    </main>
  )
}
