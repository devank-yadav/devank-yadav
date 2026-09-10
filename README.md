<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/board-dark.svg?v=1">
  <img alt="Devank Yadav — a glanceOS board showing pushes this week, public repositories, last push, and what is currently shipping." src="assets/board-light.svg?v=1">
</picture>

That board is a **glanceOS** screen. glanceOS is the dashboard platform I build — it turns any
screen into something calm and glanceable, and a GitHub profile is a screen people glance at
for about four seconds. So this one renders itself, on a schedule, from the same design
language as the real thing. Monochrome, type-first, no chrome.

---

## Now

I am a third-year Computational Data Science student at **Penn State**, graduating December 2027.

I work Penn State's IT desk — about thirty student and faculty tickets a week. I spent a summer
building factory-floor software in India. I taught myself driver code no course asked of me, and
I build things meant to run unwatched. I started the largest developer community on campus from
nothing and run it for seventy-plus members.

Currently shipping **glanceOS v9.7** — alerts that escalate on their own, teams, multi-page boards.

## Selected work

Not all of it is on GitHub. The hardware and the client work live elsewhere; those rows link out.

| | What it is | Built with |
|---|---|---|
| **[glanceOS](https://github.com/devank-yadav/glanceos)** | Turns any spare screen — a monitor, an old tablet, an e-paper panel — into a calm dashboard. No settings on the device: plug it in, claim it with a short code, done. 190 integrations, 221 block types, 166 templates, a `<32 KB` screen runtime. | TypeScript · pnpm monorepo · Docker |
| **[billgenerator](https://github.com/devank-yadav/billgenerator)** | Generates, signs, and exports vehicle duty slips for a travel operator. Runs in production on their domain. | Flask · Turso/libSQL · Vercel |
| **[AutoRename](https://github.com/devank-yadav/AutoRename)** | macOS menu-bar app that renames dropped files from what is *inside* them — OCR for images, text for PDFs, transcription for audio and video. Builds a universal `.app` with `swiftc`, no Xcode project. | Swift · Vision · PDFKit · AVFoundation |
| **[Lirra](https://github.com/devank-yadav/storycure)** | A storytelling companion for children. Detects emotion in a child's speech and text, generates a story around it, and narrates it in a cloned parent voice with comic-style art. Built at **Cal Hacks 12.0**. | React · FastAPI · Supabase · Whisper |
| **[simple-teleprompter](https://github.com/devank-yadav/simple-teleprompter)** | Adjustable speed, mirroring, keyboard control. One page, no dependencies, no build step. | Vanilla JS |
| **[Tuk Tuk](https://devpost.com/software/tuk-tuk-lowz06)** · 2025 | Campus carpooling where everyone is a verified member. Students, faculty, and staff post and search rides. Built at **HackPSU Spring 2025**. | Web |
| **Zoodu** · 2024 | Resume parsing and candidate matching, built at **HackPSU 2024** with a team of five. | Flask · OpenAI · MySQL |
| **ESP32 water-tank automation** | Embedded automation for a water tank. Runs unwatched, which is the whole point. | ESP32 · C |

Also an **iPad-to-Mac drawing tablet** with a driver I wrote myself (2026), **CarbonSight** (2025),
and a **Škoda India documentation system** built during the factory-floor summer (2025) —
write-ups at [devank.me](https://devank.me).

## How I work

I reach for the boring tool that will still run in a year. glanceOS ships as one container
because two would be a thing to maintain. AutoRename has no Xcode project because a shell script
was enough. billgenerator falls back to local SQLite when Turso isn't there, so it runs on a
laptop with no setup.

Most of what I build is meant to run without me watching it — a screen on a wall, a tank sensor,
a slip generator a business depends on on a Tuesday. That constraint decides more of my
architecture than any preference about frameworks.

**Comfortable in:** TypeScript · Python · Swift · C · React · FastAPI · Flask · Postgres ·
Supabase · Docker · embedded

## Elsewhere

[devank.me](https://devank.me) · [LinkedIn](https://linkedin.com/in/devankyadav) ·
[Devpost](https://devpost.com/devank22yadav) · dfy5121@psu.edu

<sub>The board above regenerates hourly from the GitHub API. Source in
<a href="scripts/render-board.mjs"><code>scripts/render-board.mjs</code></a>.</sub>
