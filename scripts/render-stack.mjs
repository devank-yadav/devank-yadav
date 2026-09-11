// Renders the stack panel as two SVGs — one per GitHub theme — in the same
// monochrome, type-first language as the board.
//
// Every entry is something I have shipped with; the comment beside each one
// names where. Logos are Simple Icons, vendored in icons.json.
//
// Run: node scripts/render-stack.mjs

import { readFile, writeFile } from 'node:fs/promises'

const LANGUAGES = [
  ['python', 'Python'],          // slipdesk, zoodu, lirra, carbon-sight
  ['typescript', 'TypeScript'],  // glanceos, carbon-sight
  ['javascript', 'JavaScript'],  // lirra, simple-teleprompter, glanceos tizen client
  ['openjdk', 'Java'],           // coursework
  ['c', 'C'],                    // ESP32 firmware, driver code
  ['cplusplus', 'C++'],
  ['swift', 'Swift'],            // AutoRename, glanceos tvOS client
  ['db', 'SQL'],                 // slipdesk, zoodu, carbon-sight, lirra
]

const GROUPS = [
  ['frontend', [
    ['react', 'React'],            // lirra, carbon-sight
    ['preact', 'Preact'],          // glanceos config app
    ['vite', 'Vite'],              // glanceos, lirra, carbon-sight
    ['tailwindcss', 'Tailwind'],   // carbon-sight
    ['swift', 'SwiftUI'],          // AutoRename
  ]],
  ['backend', [
    ['nodedotjs', 'Node.js'],      // glanceos server
    ['hono', 'Hono'],              // glanceos server
    ['fastapi', 'FastAPI'],        // lirra, carbon-sight
    ['flask', 'Flask'],            // slipdesk, zoodu
    ['zod', 'Zod'],                // glanceos schema
  ]],
  ['ai', [
    ['googlegemini', 'Gemini'],    // carbon-sight
    ['google', 'Google ADK'],      // carbon-sight agents
    ['claude', 'Claude'],          // slipdesk, lirra
    [null, 'OpenAI'],              // zoodu, lirra, slipdesk, AutoRename (no logo in Simple Icons)
  ]],
  ['data', [
    ['postgresql', 'Postgres'],    // supabase projects
    ['supabase', 'Supabase'],      // lirra, carbon-sight
    ['sqlite', 'SQLite'],          // glanceos, slipdesk
    [null, 'MySQL'],               // zoodu (its logo is a wordmark, unreadable at this size)
    ['turso', 'Turso'],            // slipdesk, in production
  ]],
  ['ship · test', [
    ['docker', 'Docker'],          // glanceos
    ['vercel', 'Vercel'],          // slipdesk, carbon-sight
    ['flydotio', 'Fly.io'],        // glanceos
    ['githubactions', 'GitHub Actions'], // glanceos CI, this profile
    ['vitest', 'Vitest'],          // glanceos, 860+ tests
  ]],
  ['platforms', [
    ['raspberrypi', 'Raspberry Pi'], // glanceos pi-image
    ['android', 'Android TV'],     // glanceos androidtv client
    ['appletv', 'tvOS'],           // glanceos tvos client
    ['lg', 'webOS'],               // glanceos webos client
    [null, 'Tizen'],               // glanceos tizen client (Samsung's logo is a wordmark)
    ['espressif', 'ESP32'],        // water-tank automation
    ['apple', 'macOS'],            // AutoRename
  ]],
]

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])

const MONO = `ui-monospace, SFMono-Regular, Menlo, monospace`

/** A logo, a plain database glyph for SQL, or nothing when a brand has no logo. */
function mark(icons, slug, x, y, size, ink) {
  if (slug === 'db') {
    const s = size / 24
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${ink}" stroke-width="2">` +
      `<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></g>`
  }
  const icon = slug && icons[slug]
  return icon ? `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="${ink}" d="${icon.d}"/></svg>` : ''
}

/** Lay out a row of [slug, label] items from x0, wrapping before xMax. Returns the next baseline. */
function row(out, icons, items, { x0, xMax, y, size, font, gap, ink }) {
  const charW = font * 0.61
  let x = x0
  for (const [slug, label] of items) {
    const hasMark = slug === 'db' || (slug && icons[slug])
    const w = (hasMark ? size + 7 : 0) + label.length * charW + gap
    if (x + w - gap > xMax) { x = x0; y += size + 14 }
    out.push(mark(icons, slug, x, y - size + 4, size, ink))
    out.push(`<text x="${x + (hasMark ? size + 7 : 0)}" y="${y}" font-size="${font}" fill="${ink}" font-family="${MONO}">${esc(label)}</text>`)
    x += w
  }
  return y
}

function panel(icons, theme) {
  const dark = theme === 'dark'
  const bg = dark ? '#0d1117' : '#ffffff'
  const ink = dark ? '#f0f6fc' : '#0d1117'
  const muted = dark ? '#8b949e' : '#59636e'
  const faint = dark ? '#30363d' : '#d1d9e0'

  const W = 880, LEFT = 40, COL = 168, RIGHT = W - 40
  const out = []
  let y = 58

  out.push(`<text x="${LEFT}" y="${y}" font-size="13" letter-spacing="2.4" fill="${muted}" font-family="${MONO}">STACK</text>`)
  out.push(`<text x="${RIGHT}" y="${y}" font-size="11" letter-spacing="1.4" text-anchor="end" fill="${muted}" font-family="${MONO}">FIRMWARE TO FRONTEND</text>`)

  // Languages lead, larger than everything below them.
  y = row(out, icons, LANGUAGES, { x0: LEFT, xMax: RIGHT, y: y + 44, size: 24, font: 14, gap: 26, ink })

  y += 26
  out.push(`<line x1="${LEFT}" y1="${y}" x2="${RIGHT}" y2="${y}" stroke="${faint}" stroke-width="1"/>`)
  y += 36

  for (const [label, tools] of GROUPS) {
    out.push(`<text x="${LEFT}" y="${y}" font-size="11" letter-spacing="1.4" fill="${muted}" font-family="${MONO}">${esc(label.toUpperCase())}</text>`)
    y = row(out, icons, tools, { x0: COL, xMax: RIGHT, y, size: 18, font: 12, gap: 22, ink })
    y += 34
  }

  const H = y - 8
  const all = [...LANGUAGES, ...GROUPS.flatMap(([, t]) => t)].map(([, n]) => n).join(', ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"
     aria-label="Devank Yadav — stack: ${esc(all)}.">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="0" y="0" width="${W}" height="3" fill="${ink}"/>
  ${out.join('\n  ')}
</svg>
`
}

const icons = JSON.parse(await readFile(new URL('./icons.json', import.meta.url), 'utf8'))
await writeFile('assets/stack-light.svg', panel(icons, 'light'))
await writeFile('assets/stack-dark.svg', panel(icons, 'dark'))
console.log(`stack: ${LANGUAGES.length} languages, ${GROUPS.reduce((n, [, t]) => n + t.length, 0)} tools`)
