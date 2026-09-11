// Renders the stack panel as two SVGs — one per GitHub theme — in the same
// monochrome, type-first language as the board.
//
// Languages are counted by how many repos use them, not by bytes: a single large
// project would otherwise drown out everything else and misstate the breadth.
// Tools are a curated list, and every entry names the repo that proves it.
//
// Run: GITHUB_TOKEN=... USER_LOGIN=devank-yadav node scripts/render-stack.mjs

import { readFile, writeFile } from 'node:fs/promises'

const USER = process.env.USER_LOGIN || 'devank-yadav'
const TOKEN = process.env.GITHUB_TOKEN

// Repos outside this account that are my work and appear on the profile.
const EXTRA_REPOS = ['pennapps-carbon-sight/carbon-sight']

// A language counts for a repo once it makes up this share of the repo's code.
const MIN_SHARE = 0.03
// Styling and markup are not what "which languages do you write" asks about.
const NOT_LANGUAGES = new Set(['CSS', 'SCSS', 'HTML', 'Dockerfile', 'Makefile', 'Procfile'])

// Every tool here is used in a public repo (or, for hardware, a project on devank.me).
const GROUPS = [
  ['frontend', [
    ['react', 'React'],            // lirra, carbon-sight
    ['vite', 'Vite'],              // lirra, carbon-sight
    ['tailwindcss', 'Tailwind'],   // carbon-sight
    ['swift', 'SwiftUI'],          // AutoRename
  ]],
  ['backend · ai', [
    ['fastapi', 'FastAPI'],        // lirra, carbon-sight
    ['flask', 'Flask'],            // slipdesk, zoodu
    ['googlegemini', 'Gemini'],    // carbon-sight
    ['claude', 'Claude'],          // slipdesk, lirra
    [null, 'OpenAI'],              // zoodu, lirra, slipdesk, AutoRename (no logo in Simple Icons)
    [null, 'Whisper'],             // lirra
  ]],
  ['data', [
    ['supabase', 'Supabase'],      // lirra, carbon-sight
    ['postgresql', 'Postgres'],    // via Supabase
    ['turso', 'Turso'],            // slipdesk
    ['sqlite', 'SQLite'],          // slipdesk (local)
    ['mysql', 'MySQL'],            // zoodu
  ]],
  ['infra', [
    ['docker', 'Docker'],          // glanceos
    ['flydotio', 'Fly.io'],        // glanceos
    ['vercel', 'Vercel'],          // slipdesk, carbon-sight
    ['githubactions', 'Actions'],  // glanceos CI, this profile
  ]],
  ['hardware', [
    ['espressif', 'ESP32'],        // water-tank automation
    ['c', 'C'],                    // ESP32 firmware
    ['apple', 'macOS'],            // AutoRename
  ]],
]

// Logos for the language rows, keyed by GitHub's language name.
const LANG_ICON = { TypeScript: 'typescript', Python: 'python', Swift: 'swift', JavaScript: 'javascript', Shell: 'gnubash', C: 'c' }

const api = async (path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { accept: 'application/vnd.github+json', ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) },
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

/** Public, non-fork, non-archived repos, minus this profile repo, plus EXTRA_REPOS. */
async function projectRepos() {
  const own = await api(`/users/${USER}/repos?type=owner&per_page=100`)
  const names = own
    .filter((r) => !r.private && !r.fork && !r.archived && r.name !== USER)
    .map((r) => r.full_name)
  return [...names, ...EXTRA_REPOS]
}

/** [{ name, repos }] sorted by how many repos use the language. */
async function languagesByRepo(repos) {
  const count = new Map()
  for (const full of repos) {
    const langs = await api(`/repos/${full}/languages`)
    const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1
    for (const [lang, bytes] of Object.entries(langs)) {
      if (NOT_LANGUAGES.has(lang) || bytes / total < MIN_SHARE) continue
      count.set(lang, (count.get(lang) ?? 0) + 1)
    }
  }
  return [...count].map(([name, n]) => ({ name, repos: n })).sort((a, b) => b.repos - a.repos || a.name.localeCompare(b.name))
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])

const MONO = `ui-monospace, SFMono-Regular, Menlo, monospace`
const CHAR_W = 7.3 // 12px monospace advance, generous

/** An 18px logo (or a neutral mark when there is none) followed by its name. */
function item(icons, slug, label, x, y, ink, muted) {
  const icon = slug && icons[slug]
  const mark = icon
    ? `<svg x="${x}" y="${y - 14}" width="18" height="18" viewBox="0 0 24 24"><path fill="${ink}" d="${icon.d}"/></svg>`
    : `<rect x="${x + 4}" y="${y - 10}" width="10" height="10" fill="none" stroke="${muted}" stroke-width="1.5"/>`
  return `${mark}<text x="${x + 25}" y="${y}" font-size="12" fill="${ink}" font-family="${MONO}">${esc(label)}</text>`
}
const itemWidth = (label) => 25 + label.length * CHAR_W + 22

function panel({ langs, repoCount, icons }, theme) {
  const dark = theme === 'dark'
  const bg = dark ? '#0d1117' : '#ffffff'
  const ink = dark ? '#f0f6fc' : '#0d1117'
  const muted = dark ? '#8b949e' : '#59636e'
  const faint = dark ? '#30363d' : '#d1d9e0'

  const W = 880, LEFT = 40, COL = 170, RIGHT = W - 40
  const out = []
  let y = 58

  out.push(`<text x="${LEFT}" y="${y}" font-size="13" letter-spacing="2.4" fill="${muted}" font-family="${MONO}">STACK</text>`)
  out.push(`<text x="${RIGHT}" y="${y}" font-size="11" letter-spacing="1.4" text-anchor="end" fill="${muted}" font-family="${MONO}">LANGUAGES BY REPO · ${repoCount} PUBLIC PROJECTS</text>`)
  y += 34

  // One square per project: filled when the language is used there.
  const SQ = 15, GAP = 5
  for (const { name, repos } of langs) {
    out.push(item(icons, LANG_ICON[name], name, LEFT, y, ink, muted))
    for (let i = 0; i < repoCount; i++) {
      const x = COL + i * (SQ + GAP)
      out.push(i < repos
        ? `<rect x="${x}" y="${y - 13}" width="${SQ}" height="${SQ}" fill="${ink}"/>`
        : `<rect x="${x + 0.5}" y="${y - 12.5}" width="${SQ - 1}" height="${SQ - 1}" fill="none" stroke="${faint}"/>`)
    }
    out.push(`<text x="${COL + repoCount * (SQ + GAP) + 10}" y="${y}" font-size="11" fill="${muted}" font-family="${MONO}">${repos} of ${repoCount}</text>`)
    y += 28
  }

  y += 6
  out.push(`<line x1="${LEFT}" y1="${y}" x2="${RIGHT}" y2="${y}" stroke="${faint}" stroke-width="1"/>`)
  y += 34

  // Tool groups: a label column, then logos that wrap within the row.
  for (const [label, tools] of GROUPS) {
    out.push(`<text x="${LEFT}" y="${y}" font-size="11" letter-spacing="1.4" fill="${muted}" font-family="${MONO}">${esc(label.toUpperCase())}</text>`)
    let x = COL
    for (const [slug, name] of tools) {
      const w = itemWidth(name)
      if (x + w > RIGHT + 22) { x = COL; y += 28 }
      out.push(item(icons, slug, name, x, y, ink, muted))
      x += w
    }
    y += 32
  }

  y += 4
  out.push(`<text x="${LEFT}" y="${y}" font-size="12" fill="${muted}" font-family="${MONO}">from embedded C to React</text>`)
  out.push(`<text x="${RIGHT}" y="${y}" font-size="12" text-anchor="end" fill="${muted}" font-family="${MONO}">rendered by glanceOS</text>`)
  const H = y + 26

  const summary = langs.map((l) => `${l.name} in ${l.repos}`).join(', ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"
     aria-label="Devank Yadav — stack. Languages by number of projects: ${esc(summary)}. Tools: ${esc(GROUPS.flatMap(([, t]) => t.map(([, n]) => n)).join(', '))}.">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="0" y="0" width="${W}" height="3" fill="${ink}"/>
  ${out.join('\n  ')}
</svg>
`
}

const icons = JSON.parse(await readFile(new URL('./icons.json', import.meta.url), 'utf8'))
const repos = await projectRepos()
const langs = await languagesByRepo(repos)
const data = { langs, repoCount: repos.length, icons }

await writeFile('assets/stack-light.svg', panel(data, 'light'))
await writeFile('assets/stack-dark.svg', panel(data, 'dark'))

console.log(`stack: ${repos.length} projects — ${langs.map((l) => `${l.name} ${l.repos}`).join(', ')}`)
