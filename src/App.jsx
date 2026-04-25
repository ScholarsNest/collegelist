import { useEffect, useMemo, useState } from 'react'
import heroImage from './assets/hero.png'
import './App.css'

const successImages = [
  {
    src: '/success-1.jpg',
    caption: 'Connecticut College acceptance',
  },
  {
    src: '/success-2.jpg',
    caption: 'Oberlin College acceptance',
  },
  {
    src: '/success-3.jpg',
    caption: 'Sewanee acceptance',
  },
  {
    src: '/success-4.jpg',
    caption: 'Gettysburg College acceptance',
  },
  {
    src: '/success-5.jpg',
    caption: 'Purdue University acceptance',
  },
]

const services = [
  {
    icon: '01',
    title: 'College Admissions Strategy',
    description: 'A clear roadmap for ambitious students aiming at selective universities.',
    page: 'strategy',
  },
  {
    icon: '02',
    title: 'Essay Development',
    description: 'Personal storytelling that reveals depth, maturity, and fit.',
    page: 'essay',
  },
  {
    icon: '03',
    title: 'Profile Building',
    description: 'Position academics, activities, awards, and initiatives with purpose.',
    page: 'strategy',
  },
  {
    icon: '04',
    title: 'College Fit Guidance',
    description: 'Balanced lists shaped around ambition, budget, location, and outcomes.',
    page: 'strategy',
  },
]

function pageFromHash() {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'sat-prep') return 'sat'
  if (['home', 'essay', 'strategy'].includes(hash)) return hash
  return 'home'
}

function App() {
  const [page, setPage] = useState(pageFromHash)
  const [satPrep, setSatPrep] = useState(null)
  const [activeSatId, setActiveSatId] = useState('')
  const [imageFallbacks, setImageFallbacks] = useState({})
  const [activeStory, setActiveStory] = useState(0)

  useEffect(() => {
    function handleHashChange() {
      setPage(pageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    async function loadSatPrep() {
      const response = await fetch('/sat_prep.json')
      const data = await response.json()
      setSatPrep(data)
      setActiveSatId(data.sections?.[0]?.id ?? '')
    }

    loadSatPrep().catch(() => {})
  }, [])

  useEffect(() => {
    if (page !== 'home') return undefined

    const timer = window.setInterval(() => {
      setActiveStory((current) => (current + 1) % successImages.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [page])

  const activeSatSection = useMemo(
    () => satPrep?.sections?.find((section) => section.id === activeSatId) ?? satPrep?.sections?.[0],
    [activeSatId, satPrep],
  )

  function goTo(nextPage) {
    const hash = nextPage === 'sat' ? 'sat-prep' : nextPage
    window.location.hash = hash === 'home' ? '' : hash
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function renderImage(image, index, className = '') {
    const fallback = imageFallbacks[image.src]
    return (
      <figure className={`proof-card ${className}`} key={image.src}>
        <img
          src={fallback ? heroImage : image.src}
          alt={image.caption}
          onError={() =>
            setImageFallbacks((fallbacks) => ({
              ...fallbacks,
              [image.src]: true,
            }))
          }
        />
        <figcaption>
          <span>{String(index + 1).padStart(2, '0')}</span>
          {image.caption}
        </figcaption>
      </figure>
    )
  }

  if (page === 'sat') {
    return (
      <div className="site-shell inner-page">
        <SiteHeader goTo={goTo} />
        <main className="subpage">
          <button className="back-link" type="button" onClick={() => goTo('home')}>
            Back to Scholars Nest
          </button>
          <section className="subpage-hero">
            <p className="eyebrow">Structured skill building</p>
            <h1>SAT Prep Program</h1>
            <p>
              A focused preparation page powered by the structured Writing dataset,
              organized into topic-specific practice blocks and guided review.
            </p>
          </section>
          <section className="sat-page-layout">
            <aside className="sat-topic-list">
              {(satPrep?.sections ?? []).map((section) => (
                <button
                  type="button"
                  key={section.id}
                  className={activeSatSection?.id === section.id ? 'active' : ''}
                  onClick={() => setActiveSatId(section.id)}
                >
                  <span>{section.domain}</span>
                  <strong>{section.title}</strong>
                  <small>{section.questionCount} questions</small>
                </button>
              ))}
            </aside>
            <div className="sat-topic-panel">
              <p className="eyebrow">{activeSatSection?.domain}</p>
              <h2>{activeSatSection?.title}</h2>
              <p>{activeSatSection?.recommendedTime}</p>
              <div className="topic-tip-grid">
                {activeSatSection?.tips?.map((tip) => (
                  <article key={tip}>
                    <strong>Strategy</strong>
                    <p>{tip}</p>
                  </article>
                ))}
              </div>
              <div className="sample-question">
                <span>Sample question</span>
                <p>{activeSatSection?.questions?.[0]?.passage}</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    )
  }

  if (page === 'essay') {
    return (
      <div className="site-shell inner-page">
        <SiteHeader goTo={goTo} />
        <main className="subpage">
          <button className="back-link" type="button" onClick={() => goTo('home')}>
            Back to Scholars Nest
          </button>
          <section className="subpage-hero">
            <p className="eyebrow">Essay support</p>
            <h1>Write the story only you can tell.</h1>
            <p>
              We help students move from generic application writing to specific,
              reflective essays that reveal judgment, values, maturity, and fit.
            </p>
          </section>
          <section className="subpage-grid">
            {['Story discovery', 'Structural editing', 'Voice preservation', 'Final admissions polish'].map((item) => (
              <article key={item}>
                <span>{item}</span>
                <p>
                  A mentor-led process that strengthens the idea, pressure-tests the
                  reflection, and keeps the final essay personal rather than packaged.
                </p>
              </article>
            ))}
          </section>
        </main>
      </div>
    )
  }

  if (page === 'strategy') {
    return (
      <div className="site-shell inner-page">
        <SiteHeader goTo={goTo} />
        <main className="subpage">
          <button className="back-link" type="button" onClick={() => goTo('home')}>
            Back to Scholars Nest
          </button>
          <section className="subpage-hero">
            <p className="eyebrow">College fit and strategy</p>
            <h1>A university plan built around who you are becoming.</h1>
            <p>
              We design personalized admissions strategy across school selection,
              positioning, profile development, deadlines, and scholarship priorities.
            </p>
          </section>
          <section className="subpage-grid">
            {[
              'Selective college list design',
              'Profile positioning map',
              'Scholarship-aware planning',
              'Application timeline guidance',
            ].map((item) => (
              <article key={item}>
                <span>{item}</span>
                <p>
                  Clear decisions, strong priorities, and a plan that turns ambition
                  into a coherent application strategy.
                </p>
              </article>
            ))}
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="site-shell">
      <SiteHeader goTo={goTo} />
      <main>
        <section className="landing-hero">
          <div className="hero-content">
            <p className="eyebrow">Scholars Nest</p>
            <h1>From Ambition to Top Universities — We Make It Happen</h1>
            <p>
              Premium admissions mentorship for ambitious students seeking global
              opportunities, strategic guidance, and a stronger path to selective
              universities.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-link" onClick={() => goTo('strategy')}>
                Get Started
              </button>
              <button type="button" className="secondary-link" onClick={() => goTo('strategy')}>
                Book a Free Consultation
              </button>
            </div>
          </div>
          <div className="hero-proof-stack">
            {successImages.slice(0, 3).map((image, index) => {
              const storyIndex = (activeStory + index) % successImages.length
              return renderImage(
                successImages[storyIndex],
                storyIndex,
                index === 0 ? 'featured-proof' : '',
              )
            })}
          </div>
        </section>

        <section className="proof-section" id="results">
          <div className="section-kicker">
            <p className="eyebrow">Success stories</p>
            <h2>Real Results from Real Students</h2>
            <p>
              Proof of careful positioning, thoughtful mentorship, and strategy
              built around each student’s goals.
            </p>
          </div>
          <div className="story-showcase">
            <div className="story-stage">
              {renderImage(successImages[activeStory], activeStory, 'story-popup-card')}
            </div>
            <div className="story-sidebar">
              <div className="story-copy">
                <span className="eyebrow">Success story spotlight</span>
                <h3>{successImages[activeStory].caption}</h3>
                <p>
                  Every profile is presented with sharp positioning, cleaner
                  strategy, and personalized admissions guidance.
                </p>
              </div>
              <div className="story-list">
                {successImages.map((image, index) => (
                  <button
                    type="button"
                    key={image.src}
                    className={activeStory === index ? 'active' : ''}
                    onClick={() => setActiveStory(index)}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {image.caption}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <div>
            <p className="eyebrow">About Scholars Nest</p>
            <h2>Mentorship for students who want more than a college list.</h2>
          </div>
          <p>
            Scholars Nest guides students through the high-stakes admissions journey
            with personalized strategy, thoughtful storytelling, profile positioning,
            and scholarship-focused planning. We help ambitious applicants turn raw
            potential into a polished, compelling application.
          </p>
        </section>

        <section className="services-section" id="services">
          <div className="section-kicker">
            <p className="eyebrow">Core services</p>
            <h2>Clean strategy. Personal guidance. Stronger outcomes.</h2>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <span>{service.icon}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <button type="button" onClick={() => goTo(service.page)}>
                  Learn More
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="why-section">
          <div className="why-panel">
            <p className="eyebrow">Why choose us</p>
            <h2>Built for ambitious students aiming at top universities.</h2>
          </div>
          <div className="benefit-list">
            {[
              'Personalized 1:1 mentorship',
              'Proven admission results',
              'Strategic profile positioning',
              'Scholarship-focused guidance',
            ].map((benefit) => (
              <div key={benefit}>
                <span />
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="closing-cta">
          <p className="eyebrow">Your next chapter</p>
          <h2>Your dream university isn’t out of reach — it’s just a strategy away.</h2>
          <button type="button" className="primary-link" onClick={() => goTo('strategy')}>
            Start Your Journey
          </button>
        </section>
      </main>
    </div>
  )
}

function SiteHeader({ goTo }) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => goTo('home')}>
        <span className="brand-mark">SN</span>
        <span>
          <strong>Scholars Nest</strong>
          <small>Admissions mentorship</small>
        </span>
      </button>
      <nav className="site-nav" aria-label="Primary navigation">
        <button type="button" onClick={() => goTo('home')}>Home</button>
        <a href="#results">Results</a>
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <button type="button" className="nav-cta" onClick={() => goTo('strategy')}>
          Get Started
        </button>
      </nav>
    </header>
  )
}

export default App
