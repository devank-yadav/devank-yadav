// Renders the profile board as two SVGs — one for each GitHub theme.
//
// The board is a glanceOS screen: monochrome, type-first, no chrome. It shows
// what a person glancing at the profile for four seconds should take away, and
// nothing else.
//
// Run: GITHUB_TOKEN=... USER=devank-yadav node scripts/render-board.mjs

import { writeFile } from 'node:fs/promises'

const USER = process.env.USER_LOGIN || 'devank-yadav'
const TOKEN = process.env.GITHUB_TOKEN

// The one line you edit by hand. Everything else on the board is live.
const NOW_SHIPPING = process.env.NOW_SHIPPING || 'glanceOS v9.7 — alerts, teams, multi-page boards'

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

function board({ pushes, latest, repos }, theme) {
  const dark = theme === 'dark'
  const bg = dark ? '#0d1117' : '#ffffff'
  const ink = dark ? '#f0f6fc' : '#0d1117'
  const muted = dark ? '#8b949e' : '#59636e'
  const rule = dark ? '#30363d' : '#d1d9e0'

  const W = 880
  const H = 268

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"
     aria-label="Devank Yadav — status board. ${pushes} pushes this week, ${repos} public repositories, last push ${relativeDay(latest)}.">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="0" y="0" width="${W}" height="3" fill="${ink}"/>

  <text x="40" y="58" font-size="13" letter-spacing="2.4" fill="${muted}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace">DEVANK YADAV</text>
  <text x="40" y="100" font-size="27" font-weight="600" fill="${ink}"
        font-family="ui-sans-serif, -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif">I build software people forget is running.</text>

  <line x1="40" y1="132" x2="${W - 40}" y2="132" stroke="${rule}" stroke-width="1"/>

  ${cell(40, 164, 'pushes / wk', String(pushes), ink, muted)}
  ${cell(220, 164, 'public repos', String(repos), ink, muted)}
  ${cell(400, 164, 'last push', relativeDay(latest), ink, muted, 24)}
  ${cell(620, 164, 'status', 'shipping', ink, muted, 24)}

  <text x="40" y="242" font-size="12" fill="${muted}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace">NOW · ${esc(NOW_SHIPPING)}</text>
  <text x="${W - 40}" y="242" font-size="12" text-anchor="end" fill="${muted}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace">rendered by glanceOS</text>
</svg>
`
}

const [{ pushes, latest }, user] = await Promise.all([pushActivity(), api(`/users/${USER}`)])
const data = { pushes, latest, repos: user.public_repos }

await writeFile('assets/board-light.svg', board(data, 'light'))
await writeFile('assets/board-dark.svg', board(data, 'dark'))

console.log(`board: ${pushes} pushes/wk · ${data.repos} repos · last push ${relativeDay(latest)}`)
