import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const FIELD_INDEX = {
  id: 0,
  name: 1,
  city: 2,
  state: 3,
  control: 8,
  region: 9,
  setting: 11,
  focus: 15,
  budget: 20,
  cost: 23,
  aidPercent: 27,
  aidAverage: 28,
  costAfterAid: 29,
  meetsNeed: 32,
  acceptanceRate: 43,
  testingPolicy: 65,
  satMedian: 68,
  rdDeadline: 96,
  usNewsNational: 109,
}

function cleanValue(value) {
  if (value === null || value === undefined) return ''
  const text = String(value).replace(/\u00a0/g, ' ').trim()
  if (!text || text === '-' || text === 'N/A') return ''
  if (text.toLowerCase().includes('premium edition')) return ''
  return text
}

function parseCurrency(value) {
  const text = cleanValue(value)
  if (!text) return null
  const multiplier = text.toLowerCase().includes('m') ? 1_000_000 : 1
  const numeric = Number(text.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric * multiplier : null
}

function parsePercent(value) {
  const text = cleanValue(value)
  if (!text) return null
  const numeric = Number(text.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

function parseRank(value) {
  const text = cleanValue(value)
  const match = text.match(/\d+/)
  return match ? Number(match[0]) : null
}

function formatCurrency(value) {
  if (value === null || value === undefined) return 'No data'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'No data'
  return `${value.toFixed(0)}%`
}

function normalizeSchool(row) {
  const school = {
    id: cleanValue(row[FIELD_INDEX.id]) || crypto.randomUUID(),
    name: cleanValue(row[FIELD_INDEX.name]) || 'Unknown school',
    city: cleanValue(row[FIELD_INDEX.city]),
    state: cleanValue(row[FIELD_INDEX.state]),
    control: cleanValue(row[FIELD_INDEX.control]),
    region: cleanValue(row[FIELD_INDEX.region]),
    setting: cleanValue(row[FIELD_INDEX.setting]),
    focus: cleanValue(row[FIELD_INDEX.focus]),
    budget: cleanValue(row[FIELD_INDEX.budget]),
    meetsNeed: cleanValue(row[FIELD_INDEX.meetsNeed]),
    testingPolicy: cleanValue(row[FIELD_INDEX.testingPolicy]),
    rdDeadline: cleanValue(row[FIELD_INDEX.rdDeadline]),
    cost: parseCurrency(row[FIELD_INDEX.cost]),
    costAfterAid: parseCurrency(row[FIELD_INDEX.costAfterAid]),
    aidAverage: parseCurrency(row[FIELD_INDEX.aidAverage]),
    aidPercent: parsePercent(row[FIELD_INDEX.aidPercent]),
    acceptanceRate: parsePercent(row[FIELD_INDEX.acceptanceRate]),
    satMedian: parseRank(row[FIELD_INDEX.satMedian]),
    usNewsNational: parseRank(row[FIELD_INDEX.usNewsNational]),
  }

  school.location = [school.city, school.state].filter(Boolean).join(', ')
  school.searchText = [
    school.name,
    school.location,
    school.control,
    school.region,
    school.setting,
    school.focus,
    school.budget,
    school.testingPolicy,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return school
}

function choiceEntries(choices = {}) {
  return Object.entries(choices).sort(([left], [right]) => left.localeCompare(right))
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

const STUDY_STEPS = [
  'Read the prompt first so you know whether the question is testing grammar, transitions, or synthesis.',
  'Find the sentence boundary or logic link around the blank before reading every word.',
  'Eliminate choices that create comma splices, fragments, repeated meaning, or wrong transition logic.',
  'Choose the shortest answer that keeps the sentence grammatical and clear.',
]

const COMMON_APP_PROMPTS = [
  ['1', 'Background, identity, interest, or talent'],
  ['2', 'Challenge, setback, or failure'],
  ['3', 'Challenging a belief or idea'],
  ['4', 'Gratitude'],
  ['5', 'Accomplishment or event causing growth'],
  ['6', 'Topic, idea, or concept that captivates you'],
  ['7', 'Topic of choice'],
]

const PROMPT_KEYWORDS = {
  1: ['background', 'identity', 'culture', 'family', 'talent', 'interest', 'home'],
  2: ['challenge', 'failure', 'setback', 'obstacle', 'struggle', 'mistake'],
  3: ['belief', 'idea', 'questioned', 'challenged', 'disagree', 'changed my mind'],
  4: ['gratitude', 'thankful', 'appreciate', 'kindness', 'helped me'],
  5: ['accomplishment', 'growth', 'realized', 'matured', 'event', 'turning point'],
  6: ['topic', 'idea', 'concept', 'curious', 'captivates', 'learn', 'fascinated'],
  7: ['story', 'experience', 'essay', 'anything', 'choice'],
}

function countMatches(text, keywords) {
  const lower = text.toLowerCase()
  return keywords.reduce((count, keyword) => count + (lower.includes(keyword) ? 1 : 0), 0)
}

function scoreEssay(promptNumber, essay) {
  const words = essay.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const paragraphs = essay.split(/\n+/).filter((paragraph) => paragraph.trim().length > 0)
  const lower = essay.toLowerCase()
  const firstPerson = countMatches(lower, [' i ', ' my ', ' me ', ' myself ', ' mine '])
  const reflectionSignals = countMatches(lower, [
    'i learned',
    'i realized',
    'i understood',
    'this taught me',
    'i grew',
    'changed',
    'because',
    'now',
  ])
  const growthSignals = countMatches(lower, ['growth', 'changed', 'learned', 'realized', 'became', 'now'])
  const sensorySignals = countMatches(lower, ['saw', 'heard', 'felt', 'watched', 'remember', 'moment'])
  const resumeSignals = countMatches(lower, ['president', 'founder', 'captain', 'award', 'gpa', 'club', 'internship'])
  const clicheSignals = [
    'since i was young',
    'from a young age',
    'changed my life',
    'make the world a better place',
    'hard work pays off',
    'never give up',
    'outside my comfort zone',
  ].filter((phrase) => lower.includes(phrase))
  const traumaSignals = countMatches(lower, ['death', 'abuse', 'depression', 'trauma', 'illness', 'divorce'])
  const promptScores = COMMON_APP_PROMPTS.map(([number, title]) => ({
    number,
    title,
    matches: countMatches(lower, PROMPT_KEYWORDS[number]),
  })).sort((left, right) => right.matches - left.matches)
  const selectedPrompt = COMMON_APP_PROMPTS.find(([number]) => number === promptNumber)
  const bestPrompt = promptScores[0]
  const selectedMatches = countMatches(lower, PROMPT_KEYWORDS[promptNumber] ?? [])
  const promptFit = clamp(5 + selectedMatches * 2 - (bestPrompt.number !== promptNumber ? 2 : 0), 1, 10)

  const rubric = [
    ['Prompt Alignment', 10, promptFit],
    ['Authentic Voice', 10, clamp(5 + Math.min(firstPerson, 4) + sensorySignals - resumeSignals, 2, 10)],
    ['Reflection & Insight', 15, clamp(6 + reflectionSignals * 2 + growthSignals - clicheSignals.length, 3, 15)],
    ['Personal Qualities Revealed', 10, clamp(5 + growthSignals + sensorySignals - Math.floor(resumeSignals / 2), 2, 10)],
    ['Depth vs Surface Level', 10, clamp(4 + reflectionSignals + (paragraphs.length >= 4 ? 2 : 0) - clicheSignals.length, 2, 10)],
    ['Originality & Memorability', 10, clamp(5 + sensorySignals - clicheSignals.length - Math.floor(resumeSignals / 2), 2, 10)],
    ['Narrative Structure', 10, clamp(4 + (paragraphs.length >= 3 ? 2 : 0) + (wordCount > 350 ? 2 : 0), 2, 10)],
    ['Writing Quality', 10, clamp(5 + (wordCount <= 650 ? 1 : -2) + (paragraphs.length >= 3 ? 1 : 0), 2, 10)],
    ['Overall Admissions Impact', 15, clamp(6 + reflectionSignals + growthSignals + sensorySignals - resumeSignals - clicheSignals.length, 3, 15)],
  ]
  const total = rubric.reduce((sum, [, , score]) => sum + score, 0)
  const rating =
    total >= 95 ? 'Exceptional / Top-tier' :
    total >= 90 ? 'Very Strong' :
    total >= 80 ? 'Competitive' :
    total >= 70 ? 'Decent but needs work' :
    total >= 60 ? 'Weak' :
    'Major revision needed'
  const verdict = total >= 85 ? 'Helps admission case' : total >= 72 ? 'Neutral' : 'Could hurt'

  return {
    wordCount,
    selectedPrompt,
    bestPrompt,
    promptFit,
    rubric,
    total,
    rating,
    verdict,
    clicheSignals,
    traumaSignals,
    resumeSignals,
    paragraphs,
  }
}

function App() {
  const cameraVideoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const endingMockRef = useRef(false)
  const [schools, setSchools] = useState([])
  const [satPrep, setSatPrep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [maxCost, setMaxCost] = useState(90000)
  const [schoolType, setSchoolType] = useState('')
  const [activeSchoolId, setActiveSchoolId] = useState('')
  const [activeSatId, setActiveSatId] = useState('')
  const [questionLimit, setQuestionLimit] = useState(8)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [mockMode, setMockMode] = useState('idle')
  const [mockQuestionIndex, setMockQuestionIndex] = useState(0)
  const [mockAnswers, setMockAnswers] = useState({})
  const [markedQuestions, setMarkedQuestions] = useState({})
  const [mockTimeLeft, setMockTimeLeft] = useState(31 * 60 + 19)
  const [cameraStatus, setCameraStatus] = useState('off')
  const [testWarnings, setTestWarnings] = useState(0)
  const [applicationOpen, setApplicationOpen] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [applicationProfile, setApplicationProfile] = useState({
    name: '',
    email: '',
    grade: '',
    country: '',
    targetMajor: '',
    satScore: '',
    budget: '',
    dreamSchools: '',
    supportNeed: '',
  })
  const [essayPrompt, setEssayPrompt] = useState('1')
  const [essayText, setEssayText] = useState('')
  const [essayReview, setEssayReview] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [schoolsResponse, satResponse] = await Promise.all([
          fetch('/sheet_data.json'),
          fetch('/sat_prep.json'),
        ])

        if (!schoolsResponse.ok || !satResponse.ok) {
          throw new Error('Could not load one of the public datasets.')
        }

        const [schoolData, satData] = await Promise.all([
          schoolsResponse.json(),
          satResponse.json(),
        ])

        if (!cancelled) {
          const normalizedSchools = schoolData.rows.map(normalizeSchool)
          setSchools(normalizedSchools)
          setSatPrep(satData)
          setActiveSchoolId(normalizedSchools[0]?.id ?? '')
          setActiveSatId(satData.sections?.[0]?.id ?? '')
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (mockMode !== 'active') return undefined

    const timer = window.setInterval(() => {
      setMockTimeLeft((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer)
          setMockMode('results')
          return 0
        }

        return seconds - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [mockMode])

  useEffect(() => {
    if (mockMode !== 'active') return undefined

    function handleVisibilityChange() {
      if (document.hidden) {
        setTestWarnings((count) => count + 1)
      }
    }

    function handleBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement && !endingMockRef.current) {
        setTestWarnings((count) => count + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [mockMode])

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (cameraStatus === 'ready' && cameraVideoRef.current && cameraStreamRef.current) {
      cameraVideoRef.current.srcObject = cameraStreamRef.current
    }
  }, [cameraStatus])

  const filteredSchools = useMemo(() => {
    const search = query.trim().toLowerCase()

    return schools
      .filter((school) => {
        const visibleCost = school.costAfterAid ?? school.cost
        if (search && !school.searchText.includes(search)) return false
        if (schoolType && school.control !== schoolType) return false
        if (visibleCost !== null && visibleCost > maxCost) return false
        return true
      })
      .sort((left, right) => {
        const leftCost = left.costAfterAid ?? left.cost ?? Number.MAX_SAFE_INTEGER
        const rightCost = right.costAfterAid ?? right.cost ?? Number.MAX_SAFE_INTEGER
        return leftCost - rightCost
      })
  }, [maxCost, query, schoolType, schools])

  const selectedSchool =
    filteredSchools.find((school) => school.id === activeSchoolId) ??
    filteredSchools[0] ??
    null

  const satSections = useMemo(() => satPrep?.sections ?? [], [satPrep])
  const activeSection =
    satSections.find((section) => section.id === activeSatId) ?? satSections[0]
  const visibleQuestions = activeSection?.questions?.slice(0, questionLimit) ?? []
  const activeQuestion = activeSection?.questions?.[activeQuestionIndex] ?? null
  const answerKey = activeSection && activeQuestion
    ? `${activeSection.id}-${activeQuestion.number}`
    : ''
  const totalSatQuestions = satSections.reduce(
    (sum, section) => sum + (section.questionCount || section.questions?.length || 0),
    0,
  )
  const mockQuestions = useMemo(
    () =>
      satSections
        .flatMap((section) =>
          (section.questions ?? []).map((question) => ({
            ...question,
            sectionTitle: section.title,
            domain: section.domain,
            sectionId: section.id,
          })),
        )
        .slice(0, 27),
    [satSections],
  )
  const mockQuestion = mockQuestions[mockQuestionIndex] ?? null
  const mockAnswerKey = mockQuestion
    ? `${mockQuestion.sectionId}-${mockQuestion.number}`
    : ''
  const mockAnalysis = useMemo(() => {
    const answered = mockQuestions.filter((question) => {
      const key = `${question.sectionId}-${question.number}`
      return Boolean(mockAnswers[key])
    })
    const marked = mockQuestions.filter((question) => {
      const key = `${question.sectionId}-${question.number}`
      return Boolean(markedQuestions[key])
    })
    const bySection = mockQuestions.reduce((summary, question) => {
      const key = `${question.sectionId}-${question.number}`
      const current = summary[question.sectionTitle] ?? {
        total: 0,
        answered: 0,
        marked: 0,
      }

      summary[question.sectionTitle] = {
        total: current.total + 1,
        answered: current.answered + (mockAnswers[key] ? 1 : 0),
        marked: current.marked + (markedQuestions[key] ? 1 : 0),
      }

      return summary
    }, {})

    const completion = mockQuestions.length
      ? Math.round((answered.length / mockQuestions.length) * 100)
      : 0
    const readingWritingScore = clamp(200 + Math.round(completion * 6), 200, 800)
    const mathScore = clamp(420 + Math.round(completion * 1.4), 200, 800)

    return {
      answered: answered.length,
      unanswered: mockQuestions.length - answered.length,
      marked: marked.length,
      bySection,
      completion,
      readingWritingScore,
      mathScore,
      totalScore: readingWritingScore + mathScore,
    }
  }, [markedQuestions, mockAnswers, mockQuestions])

  const scoreDomains = useMemo(() => {
    const domainBase = [
      ['Information and Ideas', 26],
      ['Craft and Structure', 28],
      ['Expression of Ideas', 20],
      ['Standard English Conventions', 26],
      ['Algebra', 35],
      ['Advanced Math', 35],
      ['Problem Solving & Data Analysis', 15],
      ['Geometry & Trigonometry', 15],
    ]

    return domainBase.map(([title, weight], index) => ({
      title,
      weight,
      filled: clamp(Math.round(mockAnalysis.completion / 15) - (index % 3), 1, 7),
      section: index < 4 ? 'Reading and Writing' : 'Math',
    }))
  }, [mockAnalysis.completion])

  const schoolStats = useMemo(() => {
    const aidValues = filteredSchools
      .map((school) => school.aidPercent)
      .filter((value) => value !== null)
    const averageAid = aidValues.length
      ? aidValues.reduce((sum, value) => sum + value, 0) / aidValues.length
      : null

    return {
      count: filteredSchools.length,
      averageAid,
      bestCost: filteredSchools[0]?.costAfterAid ?? filteredSchools[0]?.cost,
    }
  }, [filteredSchools])

  async function startCameraCheck() {
    setCameraStatus('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      })

      cameraStreamRef.current = stream
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream
      }
      setCameraStatus('ready')
    } catch {
      setCameraStatus('blocked')
    }
  }

  async function startMockTest() {
    endingMockRef.current = false
    setMockAnswers({})
    setMarkedQuestions({})
    setMockQuestionIndex(0)
    setMockTimeLeft(31 * 60 + 19)
    setTestWarnings(0)

    try {
      await document.documentElement.requestFullscreen()
    } catch {
      setTestWarnings((count) => count + 1)
    }

    setMockMode('active')
  }

  function finishMockTest() {
    endingMockRef.current = true
    setMockMode('results')
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  function closeMockTest() {
    endingMockRef.current = true
    setMockMode('idle')
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    setCameraStatus('off')
    endingMockRef.current = false
  }

  function updateApplicationProfile(field, value) {
    setApplicationProfile((profile) => ({
      ...profile,
      [field]: value,
    }))
  }

  function submitApplication(event) {
    event.preventDefault()
    setApplicationSubmitted(true)
  }

  function submitEssayReview(event) {
    event.preventDefault()
    setEssayReview(scoreEssay(essayPrompt, essayText))
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Scholars Nest home">
          <span className="brand-mark">SN</span>
          <span>
            <strong>Scholars Nest</strong>
            <small>College search + SAT Writing prep</small>
          </span>
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <button type="button" onClick={() => setApplicationOpen(true)}>
            US Application
          </button>
          <a href="#college-finder">College Finder</a>
          <a href="#sat-prep">SAT Prep</a>
          <a href="#mock-test">Mock Test</a>
          <a href="#essay-review">Essay Review</a>
          <a href="#study-plan">Study Plan</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Scholars Nest</p>
            <h1>College search and SAT prep, organized together.</h1>
            <p>
              A softer planning space for finding affordable colleges, choosing a
              target score, and practicing SAT Writing questions with a clear method.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="primary-link"
                onClick={() => setApplicationOpen(true)}
              >
                Start US application
              </button>
              <a className="primary-link" href="#college-finder">Explore colleges</a>
              <a className="secondary-link" href="#sat-prep">Start SAT practice</a>
              <a className="secondary-link" href="#mock-test">Mock Test 1</a>
            </div>
          </div>

          <div className="hero-board" aria-label="Website overview">
            <article>
              <span>College matches</span>
              <strong>{loading ? '...' : schoolStats.count}</strong>
            </article>
            <article>
              <span>Lowest visible net cost</span>
              <strong>{loading ? '...' : formatCurrency(schoolStats.bestCost)}</strong>
            </article>
            <article>
              <span>SAT Writing questions</span>
              <strong>{loading ? '...' : totalSatQuestions}</strong>
            </article>
            <article>
              <span>Practice domains</span>
              <strong>{loading ? '...' : satSections.length}</strong>
            </article>
          </div>
        </section>

        <section id="college-finder" className="workspace-section college-section">
          <div className="section-heading">
            <p className="eyebrow">Segment 1</p>
            <h2>College finder</h2>
            <p>
              A redesigned shortlist view focused on net price, testing policy,
              admission context, and the details students actually compare.
            </p>
          </div>

          <div className="finder-layout">
            <aside className="control-panel">
              <label>
                <span>Search</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="School, state, region, focus..."
                />
              </label>

              <label>
                <span>Max cost after aid: {formatCurrency(maxCost)}</span>
                <input
                  type="range"
                  min="5000"
                  max="90000"
                  step="2500"
                  value={maxCost}
                  onChange={(event) => setMaxCost(Number(event.target.value))}
                />
              </label>

              <div className="segmented-control" aria-label="School type">
                {['', 'Private', 'Public'].map((type) => (
                  <button
                    type="button"
                    key={type || 'all'}
                    className={schoolType === type ? 'active' : ''}
                    onClick={() => setSchoolType(type)}
                  >
                    {type || 'All'}
                  </button>
                ))}
              </div>

              <div className="summary-card">
                <span>Average aid coverage</span>
                <strong>{formatPercent(schoolStats.averageAid)}</strong>
                <p>{filteredSchools.length} schools in the current view.</p>
              </div>
            </aside>

            <div className="school-grid">
              {filteredSchools.length ? (
                filteredSchools.slice(0, 12).map((school) => (
                  <button
                    type="button"
                    className={`school-card ${
                      selectedSchool?.id === school.id ? 'active' : ''
                    }`}
                    key={school.id}
                    onClick={() => setActiveSchoolId(school.id)}
                  >
                    <span>{school.control || school.region || 'College'}</span>
                    <h3>{school.name}</h3>
                    <p>{school.location || 'Location not listed'}</p>
                    <div>
                      <strong>
                        {formatCurrency(school.costAfterAid ?? school.cost)}
                      </strong>
                      <small>{formatPercent(school.acceptanceRate)} acceptance</small>
                    </div>
                  </button>
                ))
              ) : (
                <article className="empty-card">
                  <h3>No colleges match those filters.</h3>
                  <p>Raise the max cost or clear the search to widen the list.</p>
                </article>
              )}
            </div>

            <aside className="detail-panel">
              <p className="eyebrow">Selected school</p>
              <h3>{selectedSchool?.name ?? 'No school selected'}</h3>
              {selectedSchool ? (
                <dl>
                  <div>
                    <dt>Location</dt>
                    <dd>{selectedSchool.location || 'No data'}</dd>
                  </div>
                  <div>
                    <dt>Net cost</dt>
                    <dd>{formatCurrency(selectedSchool.costAfterAid)}</dd>
                  </div>
                  <div>
                    <dt>Testing</dt>
                    <dd>{selectedSchool.testingPolicy || 'No data'}</dd>
                  </div>
                  <div>
                    <dt>SAT median</dt>
                    <dd>{selectedSchool.satMedian || 'No data'}</dd>
                  </div>
                  <div>
                    <dt>RD deadline</dt>
                    <dd>{selectedSchool.rdDeadline || 'No data'}</dd>
                  </div>
                  <div>
                    <dt>US News rank</dt>
                    <dd>
                      {selectedSchool.usNewsNational
                        ? `#${selectedSchool.usNewsNational}`
                        : 'No data'}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </aside>
          </div>
        </section>

        <section id="sat-prep" className="workspace-section sat-section">
          <div className="section-heading">
            <p className="eyebrow">Segment 2</p>
            <h2>{satPrep?.title ?? 'SAT Writing prep'}</h2>
            <p>
              Practice by topic, learn the solving method, and track your answer
              choices as you work through each SAT Writing segment.
            </p>
          </div>

          <div className="prep-overview">
            <article>
              <span>How to use this</span>
              <h3>Pick one section, solve slowly, then repeat under time.</h3>
              <p>
                Start with the guided question, mark an answer, review the tips,
                then open more questions from the same skill until the pattern is
                easy to recognize.
              </p>
            </article>
            <div className="method-list">
              {STUDY_STEPS.map((step, index) => (
                <div key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="sat-layout">
            <aside className="sat-sidebar">
              {satSections.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  className={activeSection?.id === section.id ? 'active' : ''}
                  onClick={() => {
                    setActiveSatId(section.id)
                    setQuestionLimit(8)
                    setActiveQuestionIndex(0)
                  }}
                >
                  <span>{section.domain}</span>
                  <strong>{section.title}</strong>
                  <small>{section.questionCount} listed questions</small>
                </button>
              ))}
            </aside>

            <div className="sat-content">
              {activeSection ? (
                <>
                  <div className="section-toolbar">
                    <div>
                      <p className="eyebrow">{activeSection.domain}</p>
                      <h3>{activeSection.title}</h3>
                      <p>{activeSection.recommendedTime}</p>
                    </div>
                    <div className="question-count">
                      <strong>{activeSection.questions?.length ?? 0}</strong>
                      <span>questions loaded</span>
                    </div>
                  </div>

                  {activeQuestion ? (
                    <article className="practice-panel">
                      <div className="practice-meta">
                        <div>
                          <p className="eyebrow">Guided practice</p>
                          <h3>Question {activeQuestion.number}</h3>
                        </div>
                        <div className="question-jumpers">
                          {activeSection.questions?.slice(0, 10).map((question, index) => (
                            <button
                              type="button"
                              key={question.number}
                              className={index === activeQuestionIndex ? 'active' : ''}
                              onClick={() => setActiveQuestionIndex(index)}
                            >
                              {question.number}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="practice-body">
                        <div>
                          <p className="passage">{activeQuestion.passage}</p>
                          <p className="prompt">{activeQuestion.prompt}</p>
                        </div>

                        <div className="answer-panel">
                          {choiceEntries(activeQuestion.choices).map(([letter, text]) => (
                            <button
                              type="button"
                              key={letter}
                              className={
                                selectedAnswers[answerKey] === letter ? 'selected' : ''
                              }
                              onClick={() =>
                                setSelectedAnswers((answers) => ({
                                  ...answers,
                                  [answerKey]: letter,
                                }))
                              }
                            >
                              <span>{letter}</span>
                              <p>{text}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="practice-footer">
                        <p>
                          {selectedAnswers[answerKey]
                            ? `Marked choice ${selectedAnswers[answerKey]}.`
                            : 'Choose an answer to mark this question.'}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveQuestionIndex((index) =>
                              Math.min(
                                index + 1,
                                (activeSection.questions?.length ?? 1) - 1,
                              ),
                            )
                          }
                        >
                          Next question
                        </button>
                      </div>
                    </article>
                  ) : null}

                  <div className="tips-row">
                    {activeSection.tips?.map((tip) => (
                      <article key={tip}>
                        <span>Tip</span>
                        <p>{tip}</p>
                      </article>
                    ))}
                  </div>

                  <div className="question-grid">
                    {visibleQuestions.map((question) => (
                      <button
                        type="button"
                        className={`question-card ${
                          activeQuestion?.number === question.number ? 'active' : ''
                        }`}
                        key={question.number}
                        onClick={() =>
                          setActiveQuestionIndex(
                            activeSection.questions.findIndex(
                              (item) => item.number === question.number,
                            ),
                          )
                        }
                      >
                        <div className="question-header">
                          <span>Question {question.number}</span>
                          <strong>{activeSection.title}</strong>
                        </div>
                        <p className="passage">{question.passage}</p>
                        <p className="prompt">{question.prompt}</p>
                        <span className="open-question">Open in guided practice</span>
                      </button>
                    ))}
                  </div>

                  {questionLimit < (activeSection.questions?.length ?? 0) ? (
                    <button
                      type="button"
                      className="load-more"
                      onClick={() => setQuestionLimit((count) => count + 8)}
                    >
                      Load more questions
                    </button>
                  ) : null}
                </>
              ) : (
                <p>Loading SAT prep...</p>
              )}
            </div>
          </div>
        </section>

        <section id="mock-test" className="workspace-section mock-launch-section">
          <div className="section-heading">
            <p className="eyebrow">Segment 3</p>
            <h2>Bluebook-style mock test</h2>
            <p>
              Launch a timed Reading and Writing module with a split screen,
              review marks, camera check, fullscreen focus, and post-test analysis.
            </p>
          </div>

          <div className="mock-launch-grid">
            <article className="mock-feature-card">
              <span>Mock Test 1</span>
              <h3>Section 1, Module 1: Reading and Writing</h3>
              <p>
                27 questions from the SAT Writing set, with a 31:19 countdown and
                Bluebook-inspired navigation.
              </p>
              <button
                type="button"
                className="mock-start-button"
                onClick={() => setMockMode('camera')}
              >
                Start Mock Test 1
              </button>
            </article>

            <div className="mock-rules-card">
              <div>
                <strong>Camera check</strong>
                <p>Students see a camera permission step before the module opens.</p>
              </div>
              <div>
                <strong>Focused test mode</strong>
                <p>The test asks for fullscreen and records tab-leave warnings.</p>
              </div>
              <div>
                <strong>Analysis after finish</strong>
                <p>Review completion, marked questions, unanswered items, and skill mix.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="study-plan" className="study-plan">
          <div id="essay-review" className="essay-review-section">
            <div className="section-heading">
              <p className="eyebrow">Segment 4</p>
              <h2>Common App Essay Review</h2>
              <p>
                Submit your selected prompt and essay. The review begins only
                after submission and reads like a selective U.S. admissions
                committee, not an English class.
              </p>
            </div>

            <form className="essay-form" onSubmit={submitEssayReview}>
              <label>
                <span>Common App prompt</span>
                <select
                  value={essayPrompt}
                  onChange={(event) => {
                    setEssayPrompt(event.target.value)
                    setEssayReview(null)
                  }}
                >
                  {COMMON_APP_PROMPTS.map(([number, title]) => (
                    <option key={number} value={number}>
                      {number}. {title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Common App essay ({essayText.trim().split(/\s+/).filter(Boolean).length}/650 words)</span>
                <textarea
                  required
                  value={essayText}
                  onChange={(event) => {
                    const nextText = event.target.value
                    const nextWords = nextText.trim().split(/\s+/).filter(Boolean)
                    if (nextWords.length <= 650) {
                      setEssayText(nextText)
                      setEssayReview(null)
                    }
                  }}
                  placeholder="Paste your Common App essay here. The review will appear after you submit."
                />
              </label>
              <button type="submit" className="mock-start-button">
                Submit essay for admissions review
              </button>
            </form>

            {essayReview ? (
              <div className="essay-report">
                <div className="essay-report-head">
                  <div>
                    <p className="eyebrow">Admissions committee review</p>
                    <h3>{essayReview.total}/100 — {essayReview.rating}</h3>
                    <p>Brutally honest verdict: <strong>{essayReview.verdict}</strong></p>
                  </div>
                  <div>
                    <span>Prompt Fit</span>
                    <strong>{essayReview.promptFit}/10</strong>
                  </div>
                </div>

                <section>
                  <h4>A. Full score breakdown</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {essayReview.rubric.map(([category, max, score]) => (
                        <tr key={category}>
                          <td>{category}</td>
                          <td>{score}/{max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="essay-grid">
                  <article>
                    <h4>B. Overall rating</h4>
                    <p>{essayReview.rating}. Total score: {essayReview.total}/100.</p>
                  </article>
                  <article>
                    <h4>E. Prompt-specific evaluation</h4>
                    <p>
                      Selected prompt {essayReview.selectedPrompt?.[0]}:
                      {' '}{essayReview.selectedPrompt?.[1]}. Strongest admissions
                      prompt appears to be prompt {essayReview.bestPrompt.number}:
                      {' '}{essayReview.bestPrompt.title}.
                    </p>
                  </article>
                </section>

                <section className="essay-grid">
                  <article>
                    <h4>C. Top 3 strengths</h4>
                    <ol>
                      <li>Shows some personal material rather than only abstract opinion.</li>
                      <li>Gives admissions readers a starting point for understanding motivation.</li>
                      <li>Has enough length to develop reflection if revised with sharper scenes.</li>
                    </ol>
                  </article>
                  <article>
                    <h4>D. Top 3 weaknesses</h4>
                    <ol>
                      <li>Reflection must move beyond what happened into why it changed you.</li>
                      <li>Admissions impact weakens if the essay reads like a resume or lesson summary.</li>
                      <li>The opening and ending need a more memorable, specific angle.</li>
                    </ol>
                  </article>
                </section>

                <section>
                  <h4>F. Cliche / Risk Analysis</h4>
                  <ul>
                    <li>Overused themes: {essayReview.clicheSignals.length ? essayReview.clicheSignals.join(', ') : 'No major stock phrase detected, but still watch for familiar lessons.'}</li>
                    <li>Trauma without reflection: {essayReview.traumaSignals ? 'Risk present if pain is described more than growth.' : 'Not strongly detected.'}</li>
                    <li>Resume-in-essay issues: {essayReview.resumeSignals > 2 ? 'High risk; reduce activity-list language.' : 'Moderate/low risk.'}</li>
                    <li>Trying-too-hard moments: watch for grand claims that are not supported by scenes.</li>
                  </ul>
                </section>

                <section>
                  <h4>G. Paragraph-by-paragraph revision suggestions</h4>
                  <ol>
                    {essayReview.paragraphs.slice(0, 6).map((paragraph, index) => (
                      <li key={`${paragraph.slice(0, 18)}-${index}`}>
                        Paragraph {index + 1}: add a sharper scene, then connect it
                        to a specific internal change. Cut generic explanation and
                        replace it with one concrete decision, detail, or consequence.
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="essay-grid">
                  <article>
                    <h4>H. How a Top 5% admitted essay would improve it</h4>
                    <p>
                      It would open in a vivid moment, reveal a quality not obvious
                      from activities, show a clear experience-reflection-growth arc,
                      and end with a changed way of thinking rather than a moral.
                    </p>
                  </article>
                  <article>
                    <h4>J. Reader simulation</h4>
                    <p><strong>Ivy/Top-20:</strong> Needs a more distinctive intellectual or personal edge to stand out.</p>
                    <p><strong>Liberal arts:</strong> More receptive if the voice becomes intimate, reflective, and discussion-oriented.</p>
                  </article>
                </section>

                <section>
                  <h4>K. Binary admissions checks</h4>
                  <div className="binary-checks">
                    <span>Memorable applicant? {essayReview.total >= 85 ? 'Yes' : 'No'}</span>
                    <span>Authentic? {essayReview.rubric[1][2] >= 7 ? 'Yes' : 'No'}</span>
                    <span>Adds beyond activities list? {essayReview.resumeSignals <= 2 ? 'Yes' : 'No'}</span>
                    <span>Shows growth? {essayReview.rubric[2][2] >= 10 ? 'Yes' : 'No'}</span>
                    <span>Helps admission case? {essayReview.verdict === 'Helps admission case' ? 'Yes' : 'No'}</span>
                  </div>
                </section>
              </div>
            ) : (
              <div className="essay-waiting-card">
                Waiting for the student to submit their prompt number and essay
                before beginning the review.
              </div>
            )}
          </div>

          <div className="section-heading">
            <p className="eyebrow">Segment 5</p>
            <h2>How to prepare</h2>
            <p>
              Use Scholars Nest in short cycles: choose target colleges, identify
              the score you need, then drill one SAT Writing skill at a time.
            </p>
          </div>
          <div className="plan-grid">
            <article>
              <span>1</span>
              <h3>Pick the college target</h3>
              <p>Use the finder to identify likely SAT ranges and testing policies.</p>
            </article>
            <article>
              <span>2</span>
              <h3>Choose a writing weakness</h3>
              <p>Open Boundaries, Form, Transitions, or Rhetorical Synthesis.</p>
            </article>
            <article>
              <span>3</span>
              <h3>Drill in timed batches</h3>
              <p>Work eight questions at a time, then load the next set.</p>
            </article>
          </div>
        </section>
      </main>

      {mockMode === 'camera' ? (
        <div className="mock-overlay">
          <section className="camera-modal" aria-label="Camera setup">
            <div>
              <p className="eyebrow">Mock Test 1 setup</p>
              <h2>Camera and focus check</h2>
              <p>
                Before starting, enable the camera preview and enter fullscreen.
                Browsers cannot fully lock a device, so Scholars Nest records
                tab-leave warnings during the mock test.
              </p>
            </div>

            <div className="camera-preview">
              {cameraStatus === 'ready' ? (
                <video ref={cameraVideoRef} autoPlay muted playsInline />
              ) : (
                <div>
                  <strong>{cameraStatus === 'blocked' ? 'Camera blocked' : 'Camera off'}</strong>
                  <p>
                    {cameraStatus === 'blocked'
                      ? 'Allow camera access in the browser to show the preview.'
                      : 'Click camera check to open the permission prompt.'}
                  </p>
                </div>
              )}
            </div>

            <div className="camera-actions">
              <button type="button" onClick={startCameraCheck}>
                {cameraStatus === 'requesting' ? 'Requesting...' : 'Camera check'}
              </button>
              <button
                type="button"
                className="mock-start-button"
                onClick={startMockTest}
                disabled={!mockQuestions.length}
              >
                Enter fullscreen and begin
              </button>
              <button type="button" onClick={closeMockTest}>Cancel</button>
            </div>
          </section>
        </div>
      ) : null}

      {mockMode === 'active' && mockQuestion ? (
        <div className="bluebook-shell">
          <header className="bluebook-topbar">
            <div>
              <strong>Section 1, Module 1: Reading and Writing</strong>
              <button type="button">Directions</button>
              <span className="lock-pill">Locked mode</span>
            </div>
            <div className="test-timer">
              <strong>{formatTime(mockTimeLeft)}</strong>
              <button type="button">Hide</button>
            </div>
            <div className="test-tools">
              <span>{cameraStatus === 'ready' ? 'Camera on' : 'Camera off'}</span>
              <span>{testWarnings} warnings</span>
              <button type="button" onClick={finishMockTest}>Finish</button>
            </div>
          </header>

          <div className="question-progress" aria-label="Question progress">
            {mockQuestions.map((question, index) => {
              const key = `${question.sectionId}-${question.number}`
              return (
                <button
                  type="button"
                  key={key}
                  className={[
                    index === mockQuestionIndex ? 'current' : '',
                    mockAnswers[key] ? 'answered' : '',
                    markedQuestions[key] ? 'marked' : '',
                  ].join(' ')}
                  onClick={() => setMockQuestionIndex(index)}
                  aria-label={`Question ${index + 1}`}
                />
              )
            })}
          </div>

          <main className="bluebook-main">
            <section className="test-passage-pane">
              <p>{mockQuestion.passage}</p>
            </section>

            <section className="test-question-pane">
              <div className="test-question-head">
                <span>{mockQuestionIndex + 1}</span>
                <button
                  type="button"
                  className={markedQuestions[mockAnswerKey] ? 'marked' : ''}
                  onClick={() =>
                    setMarkedQuestions((marks) => ({
                      ...marks,
                      [mockAnswerKey]: !marks[mockAnswerKey],
                    }))
                  }
                >
                  Mark for Review
                </button>
              </div>

              <p className="test-prompt">{mockQuestion.prompt}</p>

              <div className="test-choice-list">
                {choiceEntries(mockQuestion.choices).map(([letter, text]) => (
                  <button
                    type="button"
                    key={letter}
                    className={mockAnswers[mockAnswerKey] === letter ? 'selected' : ''}
                    onClick={() =>
                      setMockAnswers((answers) => ({
                        ...answers,
                        [mockAnswerKey]: letter,
                      }))
                    }
                  >
                    <span>{letter}</span>
                    <p>{text}</p>
                  </button>
                ))}
              </div>
            </section>
          </main>

          <footer className="bluebook-footer">
            <button
              type="button"
              onClick={() => setMockQuestionIndex((index) => Math.max(0, index - 1))}
              disabled={mockQuestionIndex === 0}
            >
              Back
            </button>
            <button type="button" className="question-menu-button">
              Question {mockQuestionIndex + 1} of {mockQuestions.length}
            </button>
            {mockQuestionIndex === mockQuestions.length - 1 ? (
              <button type="button" className="bluebook-next" onClick={finishMockTest}>
                Submit
              </button>
            ) : (
              <button
                type="button"
                className="bluebook-next"
                onClick={() =>
                  setMockQuestionIndex((index) =>
                    Math.min(mockQuestions.length - 1, index + 1),
                  )
                }
              >
                Next
              </button>
            )}
          </footer>
        </div>
      ) : null}

      {mockMode === 'results' ? (
        <div className="mock-overlay">
          <section className="sat-score-report" aria-label="SAT score report">
            <div className="score-report-title">
              <h2>SAT Scores</h2>
              <button type="button" onClick={closeMockTest}>Close</button>
            </div>

            <div className="score-report-body">
              <aside className="score-sidebar">
                <p>TOTAL SCORE</p>
                <div className="total-score-row">
                  <strong>{mockAnalysis.totalScore}</strong>
                  <span>400-1600</span>
                  <em>{clamp(Math.round(mockAnalysis.completion * 0.9), 1, 99)}th*</em>
                </div>
                <small>
                  Practice range: {mockAnalysis.totalScore - 40}-{mockAnalysis.totalScore + 40}
                </small>

                <hr />
                <p>SECTION SCORES</p>
                <div className="section-score-block">
                  <span>Reading and Writing</span>
                  <strong>{mockAnalysis.readingWritingScore}</strong>
                  <small>200-800</small>
                </div>
                <div className="section-score-block">
                  <span>Math</span>
                  <strong>{mockAnalysis.mathScore}</strong>
                  <small>200-800</small>
                </div>

                <div className="score-note">
                  <p>
                    *Estimated from completion because answer keys are not yet in
                    `sat_prep.json`.
                  </p>
                  <p>
                    Answered {mockAnalysis.answered}/{mockQuestions.length}; marked
                    {' '}{mockAnalysis.marked}; warnings {testWarnings}.
                  </p>
                </div>
              </aside>

              <section className="skills-report">
                <div>
                  <h3>Knowledge and Skills</h3>
                  <p>View your performance across the content domains measured on the SAT.</p>
                </div>

                <div className="skills-columns">
                  {['Reading and Writing', 'Math'].map((sectionName) => (
                    <div key={sectionName}>
                      <h4>{sectionName}</h4>
                      {scoreDomains
                        .filter((domain) => domain.section === sectionName)
                        .map((domain) => (
                          <article className="skill-row" key={domain.title}>
                            <strong>{domain.title}</strong>
                            <span>({domain.weight}% of test section)</span>
                            <div className="skill-bars">
                              {Array.from({ length: 7 }).map((_, index) => (
                                <i
                                  key={`${domain.title}-${index}`}
                                  className={index < domain.filled ? 'filled' : ''}
                                />
                              ))}
                            </div>
                          </article>
                        ))}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}

      {applicationOpen ? (
        <div className="mock-overlay">
          <section className="application-modal" aria-label="US application profile">
            <div className="application-head">
              <div>
                <p className="eyebrow">US Application</p>
                <h2>Submit your student profile</h2>
                <p>
                  Share the essentials so Scholars Nest can understand your goals,
                  academic profile, budget, and college support needs.
                </p>
              </div>
              <button type="button" onClick={() => setApplicationOpen(false)}>
                Close
              </button>
            </div>

            {applicationSubmitted ? (
              <div className="application-success">
                <h3>Profile submitted</h3>
                <p>
                  Thanks, {applicationProfile.name || 'student'}. Your profile is
                  saved in this session and ready for review.
                </p>
                <button
                  type="button"
                  className="mock-start-button"
                  onClick={() => {
                    setApplicationSubmitted(false)
                    setApplicationOpen(false)
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form className="application-form" onSubmit={submitApplication}>
                <label>
                  <span>Full name</span>
                  <input
                    required
                    value={applicationProfile.name}
                    onChange={(event) =>
                      updateApplicationProfile('name', event.target.value)
                    }
                    placeholder="Your name"
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    required
                    type="email"
                    value={applicationProfile.email}
                    onChange={(event) =>
                      updateApplicationProfile('email', event.target.value)
                    }
                    placeholder="you@example.com"
                  />
                </label>
                <label>
                  <span>Grade</span>
                  <select
                    required
                    value={applicationProfile.grade}
                    onChange={(event) =>
                      updateApplicationProfile('grade', event.target.value)
                    }
                  >
                    <option value="">Select grade</option>
                    <option>Grade 9</option>
                    <option>Grade 10</option>
                    <option>Grade 11</option>
                    <option>Grade 12</option>
                    <option>Gap year</option>
                  </select>
                </label>
                <label>
                  <span>Country</span>
                  <input
                    value={applicationProfile.country}
                    onChange={(event) =>
                      updateApplicationProfile('country', event.target.value)
                    }
                    placeholder="Uzbekistan, USA, ..."
                  />
                </label>
                <label>
                  <span>Target major</span>
                  <input
                    value={applicationProfile.targetMajor}
                    onChange={(event) =>
                      updateApplicationProfile('targetMajor', event.target.value)
                    }
                    placeholder="Computer science, business, economics..."
                  />
                </label>
                <label>
                  <span>SAT / target score</span>
                  <input
                    value={applicationProfile.satScore}
                    onChange={(event) =>
                      updateApplicationProfile('satScore', event.target.value)
                    }
                    placeholder="Current or target score"
                  />
                </label>
                <label>
                  <span>Annual family budget</span>
                  <input
                    value={applicationProfile.budget}
                    onChange={(event) =>
                      updateApplicationProfile('budget', event.target.value)
                    }
                    placeholder="$5,000, $15,000..."
                  />
                </label>
                <label>
                  <span>Dream schools</span>
                  <textarea
                    value={applicationProfile.dreamSchools}
                    onChange={(event) =>
                      updateApplicationProfile('dreamSchools', event.target.value)
                    }
                    placeholder="List a few colleges you are interested in"
                  />
                </label>
                <label className="wide-field">
                  <span>What help do you need?</span>
                  <textarea
                    value={applicationProfile.supportNeed}
                    onChange={(event) =>
                      updateApplicationProfile('supportNeed', event.target.value)
                    }
                    placeholder="College list, essays, scholarships, SAT plan..."
                  />
                </label>
                <button type="submit" className="mock-start-button">
                  Submit profile
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default App
