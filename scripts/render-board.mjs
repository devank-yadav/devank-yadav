// Renders the profile board as two SVGs — one for each GitHub theme.
//
// The board is a glanceOS screen: monochrome, type-first, no chrome. It shows
// what a person glancing at the profile for four seconds should take away, and
// nothing else.
//
// Run: GITHUB_TOKEN=... USER=devank-yadav node scripts/render-board.mjs

import { readFile, writeFile } from 'node:fs/promises'

const USER = process.env.USER_LOGIN || 'devank-yadav'
const TOKEN = process.env.GITHUB_TOKEN


const api = async (path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

/** Pushes in the last 7 days, and the timestamp of the most recent one. */
async function pushActivity() {
  const since = Date.now() - 7 * 864e5
  let pushes = 0
  let latest = null

  // Events are paginated 100 at a time and only go back ~90 days; three pages
  // is far more than a week of activity for any normal account.
  for (let page = 1; page <= 3; page++) {
    const events = await api(`/users/${USER}/events?per_page=100&page=${page}`)
    if (!events.length) break
    for (const e of events) {
      if (e.type !== 'PushEvent') continue
      const at = new Date(e.created_at)
      if (!latest || at > latest) latest = at
      if (at.getTime() >= since) pushes += e.payload?.size ?? 1
    }
    if (new Date(events.at(-1).created_at).getTime() < since) break
  }
  return { pushes, latest }
}


/**
 * Profile views. GitHub has no API for them, so the count comes from a hit
 * counter that visitors' browsers load through GitHub's image proxy via a 1×1
 * pixel in the README. The counter only increments on requests from that
 * proxy, so reading it here does not inflate it.
 */
const STATE_FILE = 'assets/board-state.json'
const COUNTER_URL = `https://komarev.com/ghpvc/?username=${USER}`

async function profileViews() {
  let state = { lastViews: null }
  try { state = { ...state, ...JSON.parse(await readFile(STATE_FILE, 'utf8')) } } catch {}
  try {
    const svg = await (await fetch(COUNTER_URL)).text()
    const numbers = [...svg.matchAll(/>([\d,]+)</g)].map((m) => Number(m[1].replace(/,/g, '')))
    if (!numbers.length) throw new Error('no count in counter SVG')
    state.lastViews = numbers.at(-1)
  } catch (err) {
    // Keep the last known value rather than showing a wrong one.
    console.warn(`views: ${err.message}; keeping ${state.lastViews}`)
  }
  await writeFile(STATE_FILE, JSON.stringify({ lastViews: state.lastViews }, null, 2) + '\n')
  return state.lastViews
}

const compact = (n) => (n == null ? '—' : n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString('en-US'))


/**
 * The most recent public push, excluding this profile repo. Push events no
 * longer carry commit messages, so the head commit is looked up directly.
 * Public events only: a private repo's name must never reach the board.
 */
async function latestWork() {
  const events = await api(`/users/${USER}/events/public?per_page=100`)
  const seen = new Set()
  for (const e of events) {
    if (e.type !== 'PushEvent' || !e.public || e.repo.name === `${USER}/${USER}`) continue
    if (seen.has(e.repo.name)) continue
    seen.add(e.repo.name)
    try {
      // The event only tells us which repo. Read that repo's current branch
      // head rather than the event's SHA, so rewritten or squashed history
      // never resurfaces here.
      const [c] = await api(`/repos/${e.repo.name}/commits?per_page=1`)
      const message = c.commit.message.split('\n')[0].trim()
      if (/^Merge (branch|pull request|remote-tracking)/i.test(message)) continue
      return { repo: e.repo.name.split('/')[1], message }
    } catch { continue }
  }
  return null
}

const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

/** When this render happened, in the owner's local time. */
const updatedAt = () =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: process.env.BOARD_TZ || 'America/New_York',
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date()).replace(',', ' ·').replace(/,/g, '')

const relativeDay = (date) => {
  if (!date) return 'unknown'
  const days = Math.floor((Date.now() - date.getTime()) / 864e5)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])

/** One stat cell: a small uppercase label above a large value. */
const cell = (x, y, label, value, ink, muted, size = 34) => `
  <text x="${x}" y="${y}" font-size="11" letter-spacing="1.6" fill="${muted}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${esc(label.toUpperCase())}</text>
  <text x="${x}" y="${y + 38}" font-size="${size}" font-weight="600" fill="${ink}"
        font-family="ui-sans-serif, -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif">${esc(value)}</text>`

function board({ pushes, latest, repos, views, updated, work }, theme) {
  const dark = theme === 'dark'
  const bg = dark ? '#0d1117' : '#ffffff'
  const ink = dark ? '#f0f6fc' : '#0d1117'
  const muted = dark ? '#8b949e' : '#59636e'
  const rule = dark ? '#30363d' : '#d1d9e0'

  const W = 880
  const H = 268

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"
     aria-label="Devank Yadav — status board. ${pushes} pushes this week, ${repos} public repositories, last push ${relativeDay(latest)}, ${compact(views)} profile views. Updated ${updated}.">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="0" y="0" width="${W}" height="3" fill="${ink}"/>

  <text x="40" y="58" font-size="13" letter-spacing="2.4" fill="${muted}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace">DEVANK YADAV</text>
  <text x="${W - 40}" y="58" font-size="11" letter-spacing="1.4" text-anchor="end" fill="${muted}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace">UPDATED ${esc(updated.toUpperCase())}</text>
  <text x="38" y="112" font-size="48" font-weight="700" letter-spacing="-1" fill="${ink}"
        font-family="ui-sans-serif, -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif">I build.</text>

  <line x1="40" y1="132" x2="${W - 40}" y2="132" stroke="${rule}" stroke-width="1"/>

  ${cell(40, 164, 'pushes / wk', String(pushes), ink, muted)}
  ${cell(220, 164, 'public repos', String(repos), ink, muted)}
  ${cell(400, 164, 'last push', relativeDay(latest), ink, muted, 24)}
  ${cell(620, 164, 'profile views', compact(views), ink, muted)}

  <text x="40" y="242" font-size="12" fill="${muted}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${work ? `LATEST · ${esc(truncate(`${work.repo} — ${work.message}`, 72))}` : ''}</text>
  <text x="${W - 40}" y="242" font-size="12" text-anchor="end" fill="${muted}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace">rendered by glanceOS</text>
</svg>
`
}

const [{ pushes, latest }, user, views, work] = await Promise.all([
  pushActivity(), api(`/users/${USER}`), profileViews(), latestWork(),
])
const data = { pushes, latest, repos: user.public_repos, views, updated: updatedAt(), work }

await writeFile('assets/board-light.svg', board(data, 'light'))
await writeFile('assets/board-dark.svg', board(data, 'dark'))

console.log(`board: ${pushes} pushes/wk · ${data.repos} repos · last push ${relativeDay(latest)} · ${compact(views)} views · ${data.updated}`)
