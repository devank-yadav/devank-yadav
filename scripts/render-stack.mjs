// Renders the stack panel as two SVGs — one per GitHub theme — in the same
// monochrome, type-first language as the board.
//
// Two things on it are live, refreshed hourly with the board:
//   - a stats strip (commits this year, tests in glanceOS, and the panel's own counts)
//   - a NOW spotlight: the languages and tools of whichever public repo I pushed to
//     most recently turn into filled chips
//
// Every entry lists the repos that use it; that list is what the spotlight reads,
// and it doubles as the evidence for the entry. Logos are Simple Icons, vendored
// in icons.json.
//
// Run: GITHUB_TOKEN=... USER_LOGIN=devank-yadav node scripts/render-stack.mjs

import { readFile, writeFile } from 'node:fs/promises'

const USER = process.env.USER_LOGIN || 'devank-yadav'
const TOKEN = process.env.GITHUB_TOKEN

// [logo slug, label, repos that use it]. A null slug renders as text only.
const LANGUAGES = [
  ['python', 'Python', ['slipdesk', 'zoodu', 'lirra', 'carbon-sight']],
  ['typescript', 'TypeScript', ['glanceos', 'carbon-sight']],
  ['javascript', 'JavaScript', ['lirra', 'simple-teleprompter', 'glanceos']],
  ['openjdk', 'Java', []],
  ['c', 'C', []],
  ['cplusplus', 'C++', []],
  ['swift', 'Swift', ['AutoRename', 'glanceos']],
  ['db', 'SQL', ['slipdesk', 'zoodu', 'carbon-sight', 'lirra']],
]

const GROUPS = [
  ['frontend', [
    ['react', 'React', ['lirra', 'carbon-sight']],
    ['preact', 'Preact', ['glanceos']],
    ['vite', 'Vite', ['glanceos', 'lirra', 'carbon-sight']],
    ['tailwindcss', 'Tailwind', ['carbon-sight']],
    ['swift', 'SwiftUI', ['AutoRename']],
  ]],
  ['backend', [
    ['nodedotjs', 'Node.js', ['glanceos']],
    ['hono', 'Hono', ['glanceos']],
    ['fastapi', 'FastAPI', ['lirra', 'carbon-sight']],
    ['flask', 'Flask', ['slipdesk', 'zoodu']],
    ['zod', 'Zod', ['glanceos']],
    ['google', 'Google ADK', ['carbon-sight']],
  ]],
  ['data', [
    ['postgresql', 'Postgres', ['lirra', 'carbon-sight']],
    ['supabase', 'Supabase', ['lirra', 'carbon-sight']],
    ['sqlite', 'SQLite', ['glanceos', 'slipdesk']],
    [null, 'MySQL', ['zoodu']], // wordmark logo, unreadable at this size
    ['turso', 'Turso', ['slipdesk']],
  ]],
  ['ship · test', [
    ['docker', 'Docker', ['glanceos']],
    ['vercel', 'Vercel', ['slipdesk', 'carbon-sight']],
    ['flydotio', 'Fly.io', ['glanceos']],
    ['githubactions', 'GitHub Actions', ['glanceos']],
    ['vitest', 'Vitest', ['glanceos']],
  ]],
  ['platforms', [
    ['raspberrypi', 'Raspberry Pi', ['glanceos']],
    ['android', 'Android TV', ['glanceos']],
    ['appletv', 'tvOS', ['glanceos']],
    ['lg', 'webOS', ['glanceos']],
    [null, 'Tizen', ['glanceos']], // Samsung's logo is a wordmark
    ['espressif', 'ESP32', []],     // water-tank automation, off GitHub
    ['apple', 'macOS', ['AutoRename']],
  ]],
]

// GitHub language names that map onto a label above.
const GITHUB_LANG = { Python: 'Python', TypeScript: 'TypeScript', JavaScript: 'JavaScript', Java: 'Java', C: 'C', 'C++': 'C++', Swift: 'Swift', PLpgSQL: 'SQL', TSQL: 'SQL' }

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { accept: 'application/vnd.github+json', ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}), ...init.headers },
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

/**
 * The repo of my most recent public push, excluding this profile repo, and the
 * labels to light up for it: the entries that list it, plus any of its GitHub
 * languages, so a brand-new repo still lights its languages.
 */
async function nowSpotlight() {
  try {
    const events = await api(`/users/${USER}/events/public?per_page=100`)
    const push = events.find((e) => e.type === 'PushEvent' && e.public && e.repo.name !== `${USER}/${USER}`)
    if (!push) return null
    const [owner, repo] = push.repo.name.split('/')
    const lit = new Set()
    for (const [, label, repos] of [...LANGUAGES, ...GROUPS.flatMap(([, t]) => t)]) {
      if (repos.includes(repo)) lit.add(label)
    }
    const langs = await api(`/repos/${owner}/${repo}/languages`)
    const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1
    for (const [lang, bytes] of Object.entries(langs)) {
      if (GITHUB_LANG[lang] && bytes / total >= 0.03) lit.add(GITHUB_LANG[lang])
    }
    return { repo, lit }
  } catch (err) {
    console.warn(`now: ${err.message}`)
    return null
  }
}

/** Commits this calendar year, as GitHub counts them for the contribution graph. */
async function commitsThisYear() {
  const year = new Date().getUTCFullYear()
  try {
    const body = JSON.stringify({
      query: `{ user(login: "${USER}") { contributionsCollection(from: "${year}-01-01T00:00:00Z") { totalCommitContributions } } }`,
    })
    const res = await api('/graphql', { method: 'POST', body, headers: { 'content-type': 'application/json' } })
    return { year, count: res.data.user.contributionsCollection.totalCommitContributions }
  } catch (err) {
    console.warn(`commits: ${err.message}`)
    return { year, count: null }
  }
}

/** The test count glanceOS's README states, so it moves when the README does. */
async function glanceosTests() {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${USER}/glanceos/main/README.md`)
    return (await res.text()).match(/(\d[\d,]*\+?) tests/)?.[1] ?? null
  } catch {
    return null
  }
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])
const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n))

const MONO = `ui-monospace, SFMono-Regular, Menlo, monospace`

/** A logo, a plain database glyph for SQL, or nothing when a brand has no logo. */
function mark(icons, slug, x, y, size, color) {
  if (slug === 'db') {
    const s = size / 24
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="2">` +
      `<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></g>`
  }
  const icon = slug && icons[slug]
  return icon ? `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="${color}" d="${icon.d}"/></svg>` : ''
}

/**
 * Lay out a row of entries from x0, wrapping before xMax. Entries in `lit` are
 * drawn as filled chips with inverted colours. Returns the last baseline.
 */
function row(out, icons, items, { x0, xMax, y, size, font, gap, ink, bg, lit }) {
  const charW = font * 0.61
  const PAD = 6
  let x = x0
  for (const [slug, label] of items) {
    const hasMark = slug === 'db' || (slug && icons[slug])
    const inner = (hasMark ? size + 7 : 0) + label.length * charW
    const w = inner + gap
    if (x + inner > xMax) { x = x0; y += size + 16 }
    const on = lit?.has(label)
    if (on) out.push(`<rect x="${x - PAD}" y="${y - size - 1}" width="${inner + PAD * 2}" height="${size + 10}" rx="3" fill="${ink}"/>`)
    const color = on ? bg : ink
    out.push(mark(icons, slug, x, y - size + 4, size, color))
    out.push(`<text x="${x + (hasMark ? size + 7 : 0)}" y="${y}" font-size="${font}" fill="${color}" font-family="${MONO}">${esc(label)}</text>`)
    x += w
  }
  return y
}

function panel({ icons, now, commits, tests }, theme) {
  const dark = theme === 'dark'
  const bg = dark ? '#0d1117' : '#ffffff'
  const ink = dark ? '#f0f6fc' : '#0d1117'
  const muted = dark ? '#8b949e' : '#59636e'
  const faint = dark ? '#30363d' : '#d1d9e0'

  const W = 880, LEFT = 40, COL = 168, RIGHT = W - 40
  const out = []
  const lit = now?.lit

  const toolCount = GROUPS.reduce((n, [, t]) => n + t.length, 0)
  const platforms = GROUPS.find(([g]) => g === 'platforms')[1].length
  const stats = [
    `${LANGUAGES.length} LANGUAGES`,
    `${toolCount} TOOLS`,
    `${platforms} PLATFORMS`,
    tests && `${tests} TESTS`,
    commits.count != null && `${compact(commits.count)} COMMITS IN ${commits.year}`,
  ].filter(Boolean).join('  ·  ')

  let y = 58
  out.push(`<text x="${LEFT}" y="${y}" font-size="13" letter-spacing="2.4" fill="${muted}" font-family="${MONO}">STACK</text>`)
  if (now) {
    const text = `NOW · ${now.repo}`
    out.push(`<text x="${RIGHT}" y="${y}" font-size="11" letter-spacing="1.4" text-anchor="end" fill="${ink}" font-family="${MONO}">${esc(text.toUpperCase())}</text>`)
    out.push(`<circle cx="${RIGHT - text.length * 8.1 - 12}" cy="${y - 4}" r="4" fill="${ink}"/>`)
  }
  y += 26
  out.push(`<text x="${LEFT}" y="${y}" font-size="11" letter-spacing="1.2" fill="${ink}" font-family="${MONO}">${esc(stats)}</text>`)

  // Languages lead, larger than everything below them.
  y = row(out, icons, LANGUAGES, { x0: LEFT, xMax: RIGHT, y: y + 48, size: 24, font: 14, gap: 26, ink, bg, lit })

  y += 26
  out.push(`<line x1="${LEFT}" y1="${y}" x2="${RIGHT}" y2="${y}" stroke="${faint}" stroke-width="1"/>`)
  y += 38

  for (const [label, tools] of GROUPS) {
    out.push(`<text x="${LEFT}" y="${y}" font-size="11" letter-spacing="1.4" fill="${muted}" font-family="${MONO}">${esc(label.toUpperCase())}</text>`)
    y = row(out, icons, tools, { x0: COL, xMax: RIGHT, y, size: 18, font: 12, gap: 24, ink, bg, lit })
    y += 36
  }

  const H = y - 8
  const all = [...LANGUAGES, ...GROUPS.flatMap(([, t]) => t)].map(([, n]) => n).join(', ')
  const nowText = now ? ` Currently working in ${now.repo}: ${[...now.lit].join(', ')}.` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"
     aria-label="Devank Yadav — stack. ${esc(stats.toLowerCase())}. ${esc(all)}.${esc(nowText)}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="0" y="0" width="${W}" height="3" fill="${ink}"/>
  ${out.join('\n  ')}
</svg>
`
}

const icons = JSON.parse(await readFile(new URL('./icons.json', import.meta.url), 'utf8'))
const [now, commits, tests] = await Promise.all([nowSpotlight(), commitsThisYear(), glanceosTests()])
const data = { icons, now, commits, tests }

await writeFile('assets/stack-light.svg', panel(data, 'light'))
await writeFile('assets/stack-dark.svg', panel(data, 'dark'))

console.log(`stack: now ${now ? `${now.repo} → ${[...now.lit].join(', ')}` : '—'} · ${commits.count} commits in ${commits.year} · ${tests} tests`)
