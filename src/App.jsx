import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import './App.css'

const FIELD_INDEX = {
  id: 0,
  name: 1,
  city: 2,
  state: 3,
  fullState: 4,
  top25: 5,
  top100: 6,
  global200: 7,
  control: 8,
  region: 9,
  metro: 10,
  setting: 11,
  size: 12,
  gender: 13,
  hbcu: 14,
  focus: 15,
  undergraduate: 16,
  housing: 17,
  religious: 18,
  religion: 19,
  budget: 20,
  tuition: 21,
  roomBoard: 22,
  cost: 23,
  costYear: 24,
  aidType: 25,
  aidStudents: 26,
  aidPercent: 27,
  aidAverage: 28,
  costAfterAid: 29,
  source: 30,
  totalAwarded: 31,
  meetsNeed: 32,
  largestMerit: 33,
  scholarshipInfo: 34,
  costAfterMerit: 36,
  biggestScholarship: 37,
  scholarshipApply: 38,
  notes: 39,
  aidAwardRate: 40,
  needMetPercent: 42,
  acceptanceRate: 43,
  internationalAdmissionRate: 44,
  admissionClassYear: 45,
  yieldRate: 46,
  internationalYield: 47,
  countriesRepresented: 54,
  rdAcceptanceRate: 55,
  earlyPlan: 57,
  testingPolicy: 65,
  satSubmitPercent: 66,
  actSubmitPercent: 67,
  satMedian: 68,
  actMedian: 74,
  edDeadline: 92,
  eaDeadline: 93,
  priorityDeadline: 94,
  rollingAdmission: 95,
  rdDeadline: 96,
  financialAidDeadline: 106,
  notificationDate: 107,
  latestCds: 108,
  usNewsNational: 109,
  timesHigherEd: 110,
  qsWorld: 112,
  wsjRank: 114,
  csRank: 122,
  businessRank: 124,
  economicsRank: 126,
  budgetCategory1: 151,
  zeroEfc: 152,
  fiveKEfc: 153,
}

const PLACEHOLDER_PATTERNS = [
  'support on patreon',
  'join our patreon',
  'available in premium edition',
  'premium edition',
]

function cleanValue(value) {
  if (value === null || value === undefined) return ''
  const text = String(value).replace(/\u00a0/g, ' ').trim()
  if (!text || text === '-' || text === 'N/A') return ''

  const lower = text.toLowerCase()
  if (PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return ''
  }

  return text
}

function parseCurrency(value) {
  const text = cleanValue(value)
  if (!text) return null

  const multiplier = text.toLowerCase().includes('m') ? 1_000_000 : 1
  const numeric = Number(text.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) && numeric >= 0 ? numeric * multiplier : null
}

function parsePercent(value) {
  const text = cleanValue(value)
  if (!text) return null
  const numeric = Number(text.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

function parseRank(value) {
  const text = cleanValue(value)
  if (!text) return null
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

function formatCompactCurrency(value) {
  if (value === null || value === undefined) return 'No data'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'No data'
  return `${value.toFixed(0)}%`
}

function formatScore(value) {
  if (value === null || value === undefined) return 'No data'
  return value.toFixed(0)
}

function optionList(items) {
  return [...new Set(items.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  )
}

function normalizeRow(row) {
  const school = {
    id: cleanValue(row[FIELD_INDEX.id]) || crypto.randomUUID(),
    name: cleanValue(row[FIELD_INDEX.name]) || 'Unknown school',
    city: cleanValue(row[FIELD_INDEX.city]),
    state: cleanValue(row[FIELD_INDEX.state]),
    fullState: cleanValue(row[FIELD_INDEX.fullState]),
    control: cleanValue(row[FIELD_INDEX.control]),
    region: cleanValue(row[FIELD_INDEX.region]),
    metro: cleanValue(row[FIELD_INDEX.metro]),
    setting: cleanValue(row[FIELD_INDEX.setting]),
    size: cleanValue(row[FIELD_INDEX.size]),
    gender: cleanValue(row[FIELD_INDEX.gender]),
    hbcu: cleanValue(row[FIELD_INDEX.hbcu]),
    focus: cleanValue(row[FIELD_INDEX.focus]),
    undergraduate: cleanValue(row[FIELD_INDEX.undergraduate]),
    housing: cleanValue(row[FIELD_INDEX.housing]),
    religious: cleanValue(row[FIELD_INDEX.religious]),
    religion: cleanValue(row[FIELD_INDEX.religion]),
    budget: cleanValue(row[FIELD_INDEX.budget]),
    budgetCategory1: cleanValue(row[FIELD_INDEX.budgetCategory1]),
    aidType: cleanValue(row[FIELD_INDEX.aidType]),
    source: cleanValue(row[FIELD_INDEX.source]),
    meetsNeed: cleanValue(row[FIELD_INDEX.meetsNeed]),
    largestMerit: cleanValue(row[FIELD_INDEX.largestMerit]),
    scholarshipInfo: cleanValue(row[FIELD_INDEX.scholarshipInfo]),
    biggestScholarship: cleanValue(row[FIELD_INDEX.biggestScholarship]),
    scholarshipApply: cleanValue(row[FIELD_INDEX.scholarshipApply]),
    notes: cleanValue(row[FIELD_INDEX.notes]),
    admissionClassYear: cleanValue(row[FIELD_INDEX.admissionClassYear]),
    testingPolicy: cleanValue(row[FIELD_INDEX.testingPolicy]),
    edDeadline: cleanValue(row[FIELD_INDEX.edDeadline]),
    eaDeadline: cleanValue(row[FIELD_INDEX.eaDeadline]),
    priorityDeadline: cleanValue(row[FIELD_INDEX.priorityDeadline]),
    rollingAdmission: cleanValue(row[FIELD_INDEX.rollingAdmission]),
    rdDeadline: cleanValue(row[FIELD_INDEX.rdDeadline]),
    financialAidDeadline: cleanValue(row[FIELD_INDEX.financialAidDeadline]),
    notificationDate: cleanValue(row[FIELD_INDEX.notificationDate]),
    latestCds: cleanValue(row[FIELD_INDEX.latestCds]),
    tuition: parseCurrency(row[FIELD_INDEX.tuition]),
    roomBoard: parseCurrency(row[FIELD_INDEX.roomBoard]),
    cost: parseCurrency(row[FIELD_INDEX.cost]),
    aidPercent: parsePercent(row[FIELD_INDEX.aidPercent]),
    aidAverage: parseCurrency(row[FIELD_INDEX.aidAverage]),
    costAfterAid: parseCurrency(row[FIELD_INDEX.costAfterAid]),
    totalAwarded: parseCurrency(row[FIELD_INDEX.totalAwarded]),
    costAfterMerit: parseCurrency(row[FIELD_INDEX.costAfterMerit]),
    aidAwardRate: parsePercent(row[FIELD_INDEX.aidAwardRate]),
    needMetPercent: parsePercent(row[FIELD_INDEX.needMetPercent]),
    acceptanceRate: parsePercent(row[FIELD_INDEX.acceptanceRate]),
    internationalAdmissionRate: parsePercent(
      row[FIELD_INDEX.internationalAdmissionRate],
    ),
    yieldRate: parsePercent(row[FIELD_INDEX.yieldRate]),
    internationalYield: parsePercent(row[FIELD_INDEX.internationalYield]),
    countriesRepresented: parsePercent(row[FIELD_INDEX.countriesRepresented]),
    rdAcceptanceRate: parsePercent(row[FIELD_INDEX.rdAcceptanceRate]),
    satSubmitPercent: parsePercent(row[FIELD_INDEX.satSubmitPercent]),
    actSubmitPercent: parsePercent(row[FIELD_INDEX.actSubmitPercent]),
    satMedian: parseRank(row[FIELD_INDEX.satMedian]),
    actMedian: parseRank(row[FIELD_INDEX.actMedian]),
    usNewsNational: parseRank(row[FIELD_INDEX.usNewsNational]),
    timesHigherEd: parseRank(row[FIELD_INDEX.timesHigherEd]),
    qsWorld: parseRank(row[FIELD_INDEX.qsWorld]),
    wsjRank: parseRank(row[FIELD_INDEX.wsjRank]),
    csRank: parseRank(row[FIELD_INDEX.csRank]),
    businessRank: parseRank(row[FIELD_INDEX.businessRank]),
    economicsRank: parseRank(row[FIELD_INDEX.economicsRank]),
    zeroEfcEligible: cleanValue(row[FIELD_INDEX.zeroEfc]) === '1',
    fiveKEfcEligible: cleanValue(row[FIELD_INDEX.fiveKEfc]) === '1',
    tags: [
      cleanValue(row[FIELD_INDEX.top25]) && 'Top 25',
      cleanValue(row[FIELD_INDEX.top100]) && 'Top 100',
      cleanValue(row[FIELD_INDEX.global200]) && 'Global Top 200',
      cleanValue(row[FIELD_INDEX.meetsNeed])?.toLowerCase().includes('yes') &&
        'Meets need',
      cleanValue(row[FIELD_INDEX.testingPolicy]) &&
        `Testing ${cleanValue(row[FIELD_INDEX.testingPolicy])}`,
      cleanValue(row[FIELD_INDEX.metro]) && 'Metro access',
    ].filter(Boolean),
  }

  school.location = [school.city, school.state].filter(Boolean).join(', ')
  school.budgetAmount = parseCurrency(school.budget)
  school.searchText = [
    school.name,
    school.location,
    school.region,
    school.control,
    school.setting,
    school.focus,
    school.aidType,
    school.biggestScholarship,
    school.metro,
    school.budget,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return school
}

function scoreSchool(school, efcTarget, preferredTesting) {
  const affordability =
    school.costAfterAid !== null ? Math.max(0, 90000 - school.costAfterAid) : 0
  const generosity = (school.aidPercent ?? 0) * 380
  const prestige =
    school.usNewsNational !== null
      ? Math.max(0, 150 - school.usNewsNational) * 260
      : 0
  const budgetFit =
    efcTarget && school.budgetAmount !== null
      ? Math.max(0, 25000 - Math.abs(school.budgetAmount - efcTarget)) * 7
      : 0
  const testingBoost =
    preferredTesting &&
    school.testingPolicy &&
    school.testingPolicy.toLowerCase().startsWith(preferredTesting.toLowerCase())
      ? 7000
      : 0

  return affordability + generosity + prestige + budgetFit + testingBoost
}

function metricTone(school) {
  if (school.costAfterAid !== null && school.costAfterAid <= 20000) {
    return 'excellent'
  }
  if (school.acceptanceRate !== null && school.acceptanceRate <= 15) {
    return 'selective'
  }
  if (school.aidPercent !== null && school.aidPercent >= 75) {
    return 'supportive'
  }
  return 'balanced'
}

function ScholarsNestLogo() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 220 220" role="presentation">
        <defs>
          <linearGradient id="sn-grad" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0f8891" />
            <stop offset="100%" stopColor="#0a5f77" />
          </linearGradient>
        </defs>
        <rect x="24" y="24" width="172" height="172" rx="54" fill="url(#sn-grad)" />
        <path
          d="M60 154c8-36 33-57 68-57s60 21 68 57"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M78 148c8-18 25-29 50-29 26 0 42 11 50 29"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M61 82l49-31 49 31-49 15z"
          fill="#ffffff"
        />
        <path d="M74 84v31" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        <circle cx="74" cy="117" r="5" fill="#ffffff" />
        <path d="M74 121l-6 18h12z" fill="#ffffff" />
        <path
          d="M97 92h17c16 0 28 9 28 24 0 13-10 22-22 22h-9v17H97z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M120 92v63l34-63v63"
          fill="none"
          stroke="#d8f8f7"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function App() {
  const [dataset, setDataset] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedControl, setSelectedControl] = useState('')
  const [selectedAid, setSelectedAid] = useState('')
  const [selectedTesting, setSelectedTesting] = useState('')
  const [selectedSetting, setSelectedSetting] = useState('')
  const [selectedBudget, setSelectedBudget] = useState('')
  const [maxCost, setMaxCost] = useState(90000)
  const [minAidCoverage, setMinAidCoverage] = useState(0)
  const [metroOnly, setMetroOnly] = useState(false)
  const [needOnly, setNeedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('fit')
  const [activeId, setActiveId] = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const response = await fetch('/sheet_data.json')
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`)
        }

        const raw = await response.json()
        const normalized = raw.rows.map(normalizeRow)

        if (!cancelled) {
          setDataset(normalized)
          setActiveId(normalized[0]?.id ?? '')
        }
      } catch {
        if (!cancelled) {
          setError('Could not load the mock dataset.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const filterOptions = useMemo(
    () => ({
      states: optionList(dataset.map((school) => school.state)),
      regions: optionList(dataset.map((school) => school.region)),
      controls: optionList(dataset.map((school) => school.control)),
      aidTypes: optionList(dataset.map((school) => school.aidType)),
      testing: optionList(dataset.map((school) => school.testingPolicy)),
      settings: optionList(dataset.map((school) => school.setting)),
      budgets: optionList(dataset.map((school) => school.budget)),
    }),
    [dataset],
  )

  const selectedBudgetAmount = parseCurrency(selectedBudget)

  const filteredSchools = useMemo(() => {
    const search = deferredQuery.trim().toLowerCase()

    const next = dataset.filter((school) => {
      const visibleCost = school.costAfterAid ?? school.cost

      if (search && !school.searchText.includes(search)) return false
      if (selectedState && school.state !== selectedState) return false
      if (selectedRegion && school.region !== selectedRegion) return false
      if (selectedControl && school.control !== selectedControl) return false
      if (selectedAid && school.aidType !== selectedAid) return false
      if (selectedTesting && school.testingPolicy !== selectedTesting) return false
      if (selectedSetting && school.setting !== selectedSetting) return false
      if (
        selectedBudgetAmount !== null &&
        selectedBudgetAmount !== undefined &&
        school.budgetAmount !== null &&
        school.budgetAmount > selectedBudgetAmount
      ) {
        return false
      }
      if (metroOnly && !school.metro) return false
      if (
        needOnly &&
        !school.meetsNeed.toLowerCase().includes('yes')
      ) {
        return false
      }
      if (visibleCost !== null && visibleCost > maxCost) return false
      if ((school.aidPercent ?? 0) < minAidCoverage) return false
      return true
    })

    const compareValue = (school) => {
      switch (sortBy) {
        case 'lowest-cost':
          return school.costAfterAid ?? school.cost ?? Number.MAX_SAFE_INTEGER
        case 'highest-aid':
          return -(school.aidAverage ?? Number.MIN_SAFE_INTEGER)
        case 'lowest-acceptance':
          return school.acceptanceRate ?? Number.MAX_SAFE_INTEGER
        case 'best-rank':
          return school.usNewsNational ?? Number.MAX_SAFE_INTEGER
        case 'alphabetical':
          return school.name
        default:
          return -scoreSchool(school, selectedBudgetAmount, selectedTesting)
      }
    }

    return [...next].sort((left, right) => {
      const leftValue = compareValue(left)
      const rightValue = compareValue(right)

      if (typeof leftValue === 'string' && typeof rightValue === 'string') {
        return leftValue.localeCompare(rightValue)
      }

      return Number(leftValue) - Number(rightValue)
    })
  }, [
    dataset,
    deferredQuery,
    maxCost,
    metroOnly,
    minAidCoverage,
    needOnly,
    selectedAid,
    selectedBudgetAmount,
    selectedControl,
    selectedRegion,
    selectedSetting,
    selectedState,
    selectedTesting,
    sortBy,
  ])

  useEffect(() => {
    if (!filteredSchools.length) {
      setActiveId('')
      return
    }

    const exists = filteredSchools.some((school) => school.id === activeId)
    if (!exists) {
      setActiveId(filteredSchools[0].id)
    }
  }, [activeId, filteredSchools])

  const selectedSchool = useMemo(
    () => filteredSchools.find((school) => school.id === activeId) ?? null,
    [activeId, filteredSchools],
  )

  const summary = useMemo(() => {
    const costs = filteredSchools
      .map((school) => school.costAfterAid ?? school.cost)
      .filter((value) => value !== null)
    const acceptance = filteredSchools
      .map((school) => school.acceptanceRate)
      .filter((value) => value !== null)
    const aidCoverage = filteredSchools
      .map((school) => school.aidPercent)
      .filter((value) => value !== null)

    const average = (values) =>
      values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null

    return {
      count: filteredSchools.length,
      averageCost: average(costs),
      averageAcceptance: average(acceptance),
      averageAidCoverage: average(aidCoverage),
    }
  }, [filteredSchools])

  const featured = filteredSchools[0]
  const quickPicks = useMemo(() => filteredSchools.slice(0, 3), [filteredSchools])
  const activeFilterCount = [
    selectedState,
    selectedRegion,
    selectedControl,
    selectedAid,
    selectedTesting,
    selectedSetting,
    selectedBudget,
    maxCost < 90000 ? 'max-cost' : '',
    minAidCoverage > 0 ? 'aid-floor' : '',
    metroOnly ? 'metro' : '',
    needOnly ? 'need' : '',
  ].filter(Boolean).length

  function clearFilters() {
    startTransition(() => {
      setQuery('')
      setSelectedState('')
      setSelectedRegion('')
      setSelectedControl('')
      setSelectedAid('')
      setSelectedTesting('')
      setSelectedSetting('')
      setSelectedBudget('')
      setMaxCost(90000)
      setMinAidCoverage(0)
      setMetroOnly(false)
      setNeedOnly(false)
      setSortBy('fit')
    })
  }

  function selectQuickBudget(amount) {
    startTransition(() => {
      setSelectedBudget(amount)
      setSortBy('fit')
    })
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-block">
          <ScholarsNestLogo />
          <div>
            <p className="brand-name">Scholars Nest</p>
            <p className="brand-tagline">Smart college discovery for aid-aware students</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="pill-button mobile-only"
            onClick={() => setMobileFiltersOpen((value) => !value)}
          >
            {mobileFiltersOpen ? 'Hide filters' : 'Show filters'}
          </button>
          <div className="live-indicator">
            <span className="live-dot" />
            Mockup mode, no backend required
          </div>
        </div>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Scholars Nest</p>
          <h1>Find the colleges that match your ambition and your budget.</h1>
          <p className="hero-text">
            A richer mock experience for browsing schools by affordability,
            admission chances, aid generosity, and lifestyle fit, now tuned for
            mobile too.
          </p>

          <div className="quick-budget-row">
            <span>Expected family contribution</span>
            <div className="budget-chips">
              {['$0', '$5,000', '$10,000', '$20,000'].map((amount) => (
                <button
                  type="button"
                  key={amount}
                  className={`chip-button ${
                    selectedBudget === amount ? 'active' : ''
                  }`}
                  onClick={() => selectQuickBudget(amount)}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-metrics">
            <article>
              <span>Matches</span>
              <strong>{loading ? '...' : summary.count}</strong>
            </article>
            <article>
              <span>Average net cost</span>
              <strong>
                {loading ? '...' : formatCompactCurrency(summary.averageCost)}
              </strong>
            </article>
            <article>
              <span>Avg. admission rate</span>
              <strong>
                {loading ? '...' : formatPercent(summary.averageAcceptance)}
              </strong>
            </article>
            <article>
              <span>Intl. aid coverage</span>
              <strong>
                {loading ? '...' : formatPercent(summary.averageAidCoverage)}
              </strong>
            </article>
          </div>
        </div>

        <div className="hero-spotlight">
          <p className="spotlight-label">Best current match</p>
          {featured ? (
            <>
              <h2>{featured.name}</h2>
              <p>{featured.location || 'Location not listed'}</p>
              <div className="spotlight-values">
                <div>
                  <span>Average after aid</span>
                  <strong>
                    {formatCurrency(featured.costAfterAid ?? featured.cost)}
                  </strong>
                </div>
                <div>
                  <span>Acceptance</span>
                  <strong>{formatPercent(featured.acceptanceRate)}</strong>
                </div>
                <div>
                  <span>Budget category</span>
                  <strong>{featured.budget || 'No data'}</strong>
                </div>
              </div>
              <div className="spotlight-tags">
                {featured.tags.slice(0, 4).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-state">Adjust filters to surface colleges here.</p>
          )}
        </div>
      </section>

      <section className="curated-strip">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Curated picks</p>
            <h2>Promising options right now</h2>
          </div>
        </div>
        <div className="quick-picks">
          {quickPicks.map((school) => (
            <button
              type="button"
              key={school.id}
              className="pick-card"
              onClick={() => setActiveId(school.id)}
            >
              <span>{school.name}</span>
              <strong>{formatCurrency(school.costAfterAid ?? school.cost)}</strong>
            </button>
          ))}
        </div>
      </section>

      <main className="dashboard">
        <aside
          className={`filters-panel ${
            mobileFiltersOpen ? 'mobile-open' : ''
          }`}
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Filter + search</p>
              <h2>Shape the list</h2>
              <p className="filter-subtitle">
                {activeFilterCount
                  ? `${activeFilterCount} filters active`
                  : 'Start with budget, testing, or location'}
              </p>
            </div>
            <button type="button" className="ghost-button" onClick={clearFilters}>
              Reset
            </button>
          </div>

          <label className="field">
            <span>Search school, city, scholarship, or region</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: engineering, merit, New York"
            />
          </label>

          <div className="quick-toggle-bar">
            <button
              type="button"
              className={`toggle-chip ${selectedControl === 'Private' ? 'active' : ''}`}
              onClick={() =>
                setSelectedControl((value) => (value === 'Private' ? '' : 'Private'))
              }
            >
              Private
            </button>
            <button
              type="button"
              className={`toggle-chip ${selectedControl === 'Public' ? 'active' : ''}`}
              onClick={() =>
                setSelectedControl((value) => (value === 'Public' ? '' : 'Public'))
              }
            >
              Public
            </button>
            <button
              type="button"
              className={`toggle-chip ${selectedTesting === 'Opt.' ? 'active' : ''}`}
              onClick={() =>
                setSelectedTesting((value) => (value === 'Opt.' ? '' : 'Opt.'))
              }
            >
              Test optional
            </button>
            <button
              type="button"
              className={`toggle-chip ${needOnly ? 'active' : ''}`}
              onClick={() => setNeedOnly((value) => !value)}
            >
              Meets need
            </button>
          </div>

          <section className="filter-group">
            <div className="filter-group-head">
              <h3>Financial fit</h3>
              <p>Match the list to your budget and aid expectations.</p>
            </div>
            <div className="filter-grid">
              <label className="field">
                <span>Expected family contribution</span>
                <select
                  value={selectedBudget}
                  onChange={(event) => setSelectedBudget(event.target.value)}
                >
                  <option value="">Any budget category</option>
                  {filterOptions.budgets.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="range-stack">
                <label className="field">
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

                <label className="field">
                  <span>Minimum international aid coverage: {minAidCoverage}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={minAidCoverage}
                    onChange={(event) =>
                      setMinAidCoverage(Number(event.target.value))
                    }
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="filter-group">
            <div className="filter-group-head">
              <h3>Academic + admissions</h3>
              <p>Use policy and selectivity filters to refine options fast.</p>
            </div>
            <div className="filter-grid">
              <label className="field">
                <span>Aid type</span>
                <select
                  value={selectedAid}
                  onChange={(event) => setSelectedAid(event.target.value)}
                >
                  <option value="">Any aid model</option>
                  {filterOptions.aidTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Testing policy</span>
                <select
                  value={selectedTesting}
                  onChange={(event) => setSelectedTesting(event.target.value)}
                >
                  <option value="">Any testing policy</option>
                  {filterOptions.testing.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="filter-group">
            <div className="filter-group-head">
              <h3>Campus + location</h3>
              <p>Filter by geography, setting, and access to metro areas.</p>
            </div>
            <div className="filter-grid">
              <label className="field">
                <span>State</span>
                <select
                  value={selectedState}
                  onChange={(event) => setSelectedState(event.target.value)}
                >
                  <option value="">All states</option>
                  {filterOptions.states.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Region</span>
                <select
                  value={selectedRegion}
                  onChange={(event) => setSelectedRegion(event.target.value)}
                >
                  <option value="">All regions</option>
                  {filterOptions.regions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Campus setting</span>
                <select
                  value={selectedSetting}
                  onChange={(event) => setSelectedSetting(event.target.value)}
                >
                  <option value="">Any setting</option>
                  {filterOptions.settings.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>School type</span>
                <select
                  value={selectedControl}
                  onChange={(event) => setSelectedControl(event.target.value)}
                >
                  <option value="">Public + private</option>
                  {filterOptions.controls.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="toggle-grid filter-actions">
            <button
              type="button"
              className={`toggle-chip ${metroOnly ? 'active' : ''}`}
              onClick={() => setMetroOnly((value) => !value)}
            >
              Metro access only
            </button>
            <button
              type="button"
              className={`toggle-chip ${needOnly ? 'active' : ''}`}
              onClick={() => setNeedOnly((value) => !value)}
            >
              Meets full need
            </button>
          </div>

          <div className="sort-row">
            <label className="field">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="fit">Best overall fit</option>
                <option value="lowest-cost">Lowest cost after aid</option>
                <option value="highest-aid">Highest average award</option>
                <option value="lowest-acceptance">Most selective</option>
                <option value="best-rank">Best national rank</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </label>
          </div>
        </aside>

        <section className="results-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Browse results</p>
              <h2>{loading ? 'Loading schools...' : `${summary.count} matches`}</h2>
            </div>
            {!loading && filteredSchools.length > 0 ? (
              <p className="micro-copy">
                Ranked for cost-fit, aid strength, selectivity, and your current
                budget target.
              </p>
            ) : null}
          </div>

          {error ? <div className="message-card error">{error}</div> : null}

          {loading ? (
            <div className="cards-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <article className="school-card skeleton-card" key={index}>
                  <div className="skeleton-line large" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </article>
              ))}
            </div>
          ) : filteredSchools.length ? (
            <div className="cards-grid">
              {filteredSchools.map((school) => (
                <button
                  type="button"
                  key={school.id}
                  className={`school-card ${
                    school.id === activeId ? 'active' : ''
                  } tone-${metricTone(school)}`}
                  onClick={() => setActiveId(school.id)}
                >
                  <div className="card-topline">
                    <span>{school.control || 'Institution'}</span>
                    <span>
                      {school.usNewsNational
                        ? `US News #${school.usNewsNational}`
                        : school.region || 'Profile'}
                    </span>
                  </div>

                  <h3>{school.name}</h3>
                  <p className="location-line">
                    {school.location || 'Location not listed'}
                  </p>

                  <div className="stats-row">
                    <div>
                      <span>Cost after aid</span>
                      <strong>
                        {formatCurrency(school.costAfterAid ?? school.cost)}
                      </strong>
                    </div>
                    <div>
                      <span>Acceptance</span>
                      <strong>{formatPercent(school.acceptanceRate)}</strong>
                    </div>
                    <div>
                      <span>Budget tier</span>
                      <strong>{school.budget || 'No data'}</strong>
                    </div>
                  </div>

                  <div className="card-tags">
                    {[school.setting, school.focus, school.aidType, school.testingPolicy]
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((tag) => (
                        <span key={`${school.id}-${tag}`}>{tag}</span>
                      ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="message-card">
              No colleges match those filters yet. Reset the controls or open up
              your budget/cost range a bit.
            </div>
          )}
        </section>

        <aside className="detail-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Selected college</p>
              <h2>{selectedSchool?.name ?? 'Choose a school'}</h2>
            </div>
            {selectedSchool?.location ? (
              <p className="micro-copy">{selectedSchool.location}</p>
            ) : null}
          </div>

          {selectedSchool ? (
            <>
              <section className="detail-section">
                <h3>Snapshot</h3>
                <div className="detail-grid">
                  <article>
                    <span>Type</span>
                    <strong>{selectedSchool.control || 'No data'}</strong>
                  </article>
                  <article>
                    <span>Setting</span>
                    <strong>{selectedSchool.setting || 'No data'}</strong>
                  </article>
                  <article>
                    <span>Size</span>
                    <strong>{selectedSchool.size || 'No data'}</strong>
                  </article>
                  <article>
                    <span>Focus</span>
                    <strong>{selectedSchool.focus || 'No data'}</strong>
                  </article>
                </div>
              </section>

              <section className="detail-section">
                <h3>Cost and aid</h3>
                <div className="detail-list">
                  <div>
                    <span>Total cost before aid</span>
                    <strong>{formatCurrency(selectedSchool.cost)}</strong>
                  </div>
                  <div>
                    <span>Average cost after aid</span>
                    <strong>{formatCurrency(selectedSchool.costAfterAid)}</strong>
                  </div>
                  <div>
                    <span>Expected family contribution bucket</span>
                    <strong>{selectedSchool.budget || 'No data'}</strong>
                  </div>
                  <div>
                    <span>Average scholarship/aid award</span>
                    <strong>{formatCurrency(selectedSchool.aidAverage)}</strong>
                  </div>
                  <div>
                    <span>International students receiving aid</span>
                    <strong>{formatPercent(selectedSchool.aidPercent)}</strong>
                  </div>
                  <div>
                    <span>Meets full need</span>
                    <strong>{selectedSchool.meetsNeed || 'No data'}</strong>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h3>Admissions</h3>
                <div className="detail-list">
                  <div>
                    <span>Overall acceptance rate</span>
                    <strong>{formatPercent(selectedSchool.acceptanceRate)}</strong>
                  </div>
                  <div>
                    <span>International admission rate</span>
                    <strong>
                      {formatPercent(selectedSchool.internationalAdmissionRate)}
                    </strong>
                  </div>
                  <div>
                    <span>Yield</span>
                    <strong>{formatPercent(selectedSchool.yieldRate)}</strong>
                  </div>
                  <div>
                    <span>Testing policy</span>
                    <strong>{selectedSchool.testingPolicy || 'No data'}</strong>
                  </div>
                  <div>
                    <span>SAT median</span>
                    <strong>{formatScore(selectedSchool.satMedian)}</strong>
                  </div>
                  <div>
                    <span>ACT median</span>
                    <strong>{formatScore(selectedSchool.actMedian)}</strong>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h3>Scholarships and timeline</h3>
                <div className="detail-list">
                  <div>
                    <span>Largest merit scholarship</span>
                    <strong>{selectedSchool.largestMerit || 'No data'}</strong>
                  </div>
                  <div>
                    <span>Scholarship name</span>
                    <strong>{selectedSchool.biggestScholarship || 'No data'}</strong>
                  </div>
                  <div>
                    <span>Apply method</span>
                    <strong>{selectedSchool.scholarshipApply || 'No data'}</strong>
                  </div>
                  <div>
                    <span>RD deadline</span>
                    <strong>{selectedSchool.rdDeadline || 'No data'}</strong>
                  </div>
                  <div>
                    <span>EA deadline</span>
                    <strong>{selectedSchool.eaDeadline || 'No data'}</strong>
                  </div>
                  <div>
                    <span>Financial aid deadline</span>
                    <strong>
                      {selectedSchool.financialAidDeadline || 'No data'}
                    </strong>
                  </div>
                </div>
                {selectedSchool.notes ? (
                  <p className="note-block">{selectedSchool.notes}</p>
                ) : null}
              </section>
            </>
          ) : (
            <div className="message-card">
              Click a college card to inspect the mock profile here.
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}

export default App
