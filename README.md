<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/board-dark.svg?v=252b07e7a3d5">
  <img alt="Devank Yadav — a glanceOS board showing pushes this week, public repositories, last push, and what is currently shipping." src="assets/board-light.svg?v=252b07e7a3d5">
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
| **[slipdesk](https://github.com/devank-yadav/slipdesk)** | Back office for a vehicle-hire operator: duty slips become customer-signed GST invoices. E-signature portal, AI slip parsing from text and images, bulk import, per-driver reports. Runs in production on their domain. | Flask · Turso/libSQL · Vercel |
| **[AutoRename](https://github.com/devank-yadav/AutoRename)** | macOS menu-bar app that renames dropped files from what is *inside* them — OCR for images, text for PDFs, transcription for audio and video. Builds a universal `.app` with `swiftc`, no Xcode project. | Swift · Vision · PDFKit · AVFoundation |
| **[Lirra](https://github.com/devank-yadav/lirra)** | A storytelling companion for children. Detects emotion in a child's speech and text, generates a story around it, and narrates it in a cloned parent voice with comic-style art. Built at **Cal Hacks 12.0**. | React · FastAPI · Supabase · Whisper |
| **[simple-teleprompter](https://github.com/devank-yadav/simple-teleprompter)** | Adjustable speed, mirroring, keyboard control. One page, no dependencies, no build step. | Vanilla JS |
| **[CarbonSight](https://github.com/pennapps-carbon-sight/carbon-sight)** · 2025 | Carbon-aware LLM routing — Google ADK agents send each prompt to the greenest Gemini model that can handle it, cache near-duplicate prompts by embedding, and reward the savings in `$GREEN`. 🏆 **MLH Best Use of the Gemini API, PennApps XXVI.** | Python · Google ADK · Gemini · React · Supabase |
| **[Tuk Tuk](https://devpost.com/software/tuk-tuk-lowz06)** · 2025 | Campus carpooling where everyone is a verified member. Students, faculty, and staff post and search rides. Built at **HackPSU Spring 2025**. | Web |
| **[Zoodu](https://github.com/devank-yadav/zoodu)** · 2024 | AI career and study guidance for students — suggests programmes that build on your degree, finds the skill gaps, and turns them into a learning plan. 🏆 **Best RAG Chatbot, HackPSU Fall 2024.** | Flask · Python · OpenAI · SQL |
| **ESP32 water-tank automation** | Embedded automation for a water tank. Runs unwatched, which is the whole point. | ESP32 · C |

Also an **iPad-to-Mac drawing tablet** with a driver I wrote myself (2026), and a **Škoda India
documentation system** built during the factory-floor summer (2025) — write-ups at
[devank.me](https://devank.me).

## How I work

I reach for the boring tool that will still run in a year. glanceOS ships as one container
because two would be a thing to maintain. AutoRename has no Xcode project because a shell script
was enough. slipdesk falls back to local SQLite when Turso isn't there, so it runs on a
laptop with no setup.

Most of what I build is meant to run without me watching it — a screen on a wall, a tank sensor,
a slip desk a business depends on on a Tuesday. That constraint decides more of my
architecture than any preference about frameworks.

**Comfortable in:** TypeScript · Python · Swift · C · React · FastAPI · Flask · Postgres ·
Supabase · Docker · embedded

## Elsewhere

[devank.me](https://devank.me) · [LinkedIn](https://linkedin.com/in/devankyadav) ·
[Devpost](https://devpost.com/devank22yadav) · dfy5121@psu.edu

<sub>The board above regenerates hourly from the GitHub API. Source in
<a href="scripts/render-board.mjs"><code>scripts/render-board.mjs</code></a>.</sub>

<!-- 1×1 hit counter: counts profile views for the board above. Invisible on purpose. -->
<img src="https://komarev.com/ghpvc/?username=devank-yadav" width="1" height="1" alt="">
