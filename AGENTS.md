<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# JnaninYoga dashboard

`next dev` only rewrites the block above. Everything below is ours, so keep it current when a rule here changes.

## Who it's for

This is the command center for one person: Ouarda, who runs the JnaninYoga studio in Marrakech alone. She uses it mostly on her phone, between classes. It is not a generic admin dashboard.

- Shape screens around her day: today's sessions, check-in, clients' cards, partner billing.
- Use her words (Price list, Discounts, Partner rates, cards, credits), not admin vocabulary.
- Design mobile-first. Skip anything that only makes sense for multi-user SaaS (roles, teams, KPI charts).

[README.md](README.md) is the original product brief. Its business ideas still hold, but its stack section is out of date. [docs/specs/](docs/specs/) has approved specs together with the owner's decisions.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript 6.
- Tailwind v4 and shadcn components in `components/ui/`.
- Primitives come from `radix-ui`. Accordion, Checkbox, Drawer, Popover, RadioGroup, Select, Switch, Tabs, Toggle and Tooltip use `@animate-ui/react` with `motion`.
- Dialog, AlertDialog, DropdownMenu and Sheet stay on plain Radix. Animate-ui's DropdownMenu mismatches ids on hydration, and the owner found its Dialog motion jerky.
- Drizzle ORM on postgres.js, with the database on Supabase Postgres. Better Auth runs inside the app (`lib/auth/`, tables in the same database) with Google as the only provider.
- Google Calendar is the source of truth for sessions. Google Contacts holds the address book. Both are reached through `googleapis` (`services/google/`).
- `@react-pdf/renderer` for quotes and invoices, Serwist for the PWA, Vitest for tests, sileo for toasts.
- Hosted on Vercel. Cloudflare Workers was measured and rejected in Oct 2026: signed-in pages use 48–75 ms of CPU against the free plan's 10 ms limit.

## Where things live

| Path | What |
| --- | --- |
| `app/(dashboard)/` | Signed-in pages: home, bookings, schedule, check-in, clients, b2b, price-list, settings |
| `app/api/public/v1/` | The only signed-out API: what the website (jnaninyoga.com) calls (see Public API) |
| `app/dev/playground/` | Dev-only page rendering the primitives and real forms without sign-in |
| `lib/domain/` | Business rules as pure, unit-tested functions (billing, clients, price-list, schedule) |
| `lib/actions/` | Server actions: load, check, write; they call into `lib/domain/` |
| `lib/validators/` | Zod schemas shared by forms and actions |
| `lib/utils/time.ts`, `currency.ts` | Studio time and money; use these, never ad-hoc formatting |
| `services/database/` | `schema.ts`, the db client and generated migrations |
| `components/` | Shared building blocks (below), then one folder per area |

## Business rules

Each rule lives in `lib/domain/`, and the matching action enforces it on the server. When a rule changes, change it there, never only in a screen.

**Cards and check-in.** A client buys a card of credits, and each valid check-in uses one. A card sale records the list price, discount, payment method and `expires_on`. Check-in takes the usable card that ends soonest, judged on the session's day. Expired cards are refused with the reason, and the same alert shows on the client's card and profile. Cards sold before expiry dates existed have none, because their buyers were never told one.

**Price list.** One `products` table holds two kinds: `membership` (credits, months, price per card) and `partner_service` (price per session for the whole group). `group_min`/`group_max` is the group size the price covers ("3–5 pax"), not a quantity. On a quotation line, the quantity counts sessions. The sidebar group is **Price list**: Memberships, Partner rates and Discounts. Use those names in the UI, routes and tables, not the old "Categories", "B2B pricing" or "Tiers".

**B2B billing** (`lib/domain/billing/`, enforced in `lib/actions/b2b/documents.ts`):

- One quotation is billed by one or many invoices over time, never for more than the quote. Each invoice bills either quantities of the quote's lines or a plain amount of what's left, spread across the lines.
- Quotations get their number when created. Invoices get theirs when issued, in issue order with no gaps. A draft invoice has no number and its PDF says BROUILLON. An issued invoice starts `unpaid`.
- Drafts count toward the quote's billed amount. Archived or cancelled invoices give their share back.
- Overdue and Expired are worked out when displayed, never stored.
- A payment goes to the viewed invoice first. Any excess goes to the quote's other open invoices, oldest first.
- Mistakes are undone with reversal rows (with a reason), never deletes.
- Refunds only go through a credit note (AV-YYYY-NNNN, numbered at issue). Credited quantities do not return to the quote's "left to invoice". An issued credit note can't be archived.

**Bookings from the website.** Every booking sent from the website lands in Bookings (`/bookings`; the table is `booking_requests`, and the code calls each one a request). It is saved before anyone is notified (phone notification, email to contact@, the count on Bookings and Today), so a failed notification never loses one. A request is never deleted; when someone asks, "Erase personal details" blanks their name, phone and message and keeps the row in her counts. A phone matches a client however either was written (`phoneKey`). Times shown for a booking ("Today 9:41") are made on the server with the studio time helpers, like every studio time, so the page and its hydration agree; they are only right when the server's Node carries current time-zone data (24.12 still says UTC+1).

**Studio hours, and the website's content.** Studio hours (Settings → Studio hours, `app_settings.working_hours`; until she saves, `DEFAULT_HOURS`: Monday and Thursday, six periods) are, per day, closed or the periods she works, with the rests as the gaps between them (`lib/domain/schedule/hours.ts`; hours saved before rests existed read as one period each). One setting, two readers: group and private sessions are only scheduled inside one period, never across a rest (`sessionProblem`), and jnaninyoga.com shows every open day, grouped by the same periods, with its words (`siteHours` in `lib/domain/website/timetable.ts`: "Lundi et jeudi, six rendez-vous."; "Six jours par semaine." when days differ), so the page's preview is what the site says. She sets each day's hours like opening hours anywhere: start–end pairs, more pairs for a split day ("Add hours" repeats the last length and rest), "Copy to…" for other days; then publishes with one button, "Save and update the website". There is no separate class-times setting. The site also shows the memberships marked "On the website" (`products.on_site`, `site_key`, `site_position`, `popular`), each with the lines under its lotus (`site_points_fr`, and `site_points_en` or the French; at most 4 lines of 60 characters; null until she writes them, so the site keeps the lines it had for that key, `SITE_LINES_BEFORE`). The site counts the cards in its heading ("Cinq façons de venir."). A save the site shows calls `requestSiteRebuild` (Cloudflare deploy hook, `SITE_DEPLOY_HOOK_URL`); a daily Vercel cron (`vercel.json`, `CRON_SECRET`) rebuilds too. A failed rebuild never fails the save: she's told the website didn't update.

**Outdoor events are outdoor sessions.** There is no separate event: an outdoor session (Schedule → New session → Outdoor, in her Google Calendar with its price) is the event the website shows. Its website part lives on its `studio_sessions` row (`on_website`, English title, descriptions, place, Maps link, optional `capacity`, `slug`, `published_at`) and is edited on its page, `/schedule/outdoor/[googleEventId]` (the Schedule card's "Bookings & website"), with who's coming and its photo (`session_photos`). It shows on the website once "Show on the website" is on (the default) and its French description and place are written; its slug comes from the title then and stays. Editing its title, day, times or price updates her calendar inside the save's transaction (Google refuses: nothing changes). Cancelling is the normal session cancel, which also rebuilds the site. Outdoor sessions are a paid extra: cards never pay for them. Website bookings close 3 hours before it starts (`BOOKING_CLOSES_HOURS`), so she has time to confirm and people to get there; after that she adds reservations by hand. Places count people (`party_size`) and are taken on confirmation; confirming, adding a reservation by hand or lowering the limit locks the session row (`lockSession`); the limit can't go under the places confirmed. The website reads the row, never her calendar, so the row follows her calendar (`lib/events/calendar-sync.ts`, rule `calendarCheck`): moved or renamed in Google Calendar itself, it updates (and the site rebuilds) wherever the dashboard reads that week (Schedule, Home), on its page, and in the daily cron. Deleted there, it is never cancelled for her: the Schedule shows it "Not in calendar", and its page offers "Put it back in my calendar" (same times, new calendar id) next to Cancel. Each signed-in account sees its own calendar, so a session looks "Not in calendar" from another account's view; put it back only from the account that holds it. Rules: `lib/domain/events/`; actions: `lib/actions/outdoor.ts`.

**Money.** Currency is MAD (the ISO code, not "DH"). Show prices only through `<Money>` (`components/money.tsx`) or `formatMoney`. Parse typed amounts with `parseAmountInput`: Ouarda types French decimals, and `500,50` once became `50050`. PDFs stay in French.

**Time.** Studio time is `Africa/Casablanca`, handled through `lib/utils/time.ts`. Never hard-code the offset: Morocco moved from UTC+1 to UTC+0 on 2026-09-20, and older Node builds (for example 24.12) still carry the old rule. Tests must use dates that every version of the time-zone data agrees on, such as June 2026 (UTC+1) or Ramadan (UTC+0).

## Code conventions

- **Every server action starts with `await requireUser()`** (`lib/auth/require-user.ts`). Actions are POST endpoints reachable from any route, and the proxy only guards pages.
- **Errors the operator can report.** On an unexpected failure, call `logServerError(scope, error)` (`lib/errors/server.ts`) and return `{ error, ref }`. The client shows it with `notifyActionError`, so the code in the toast matches the server log. Other toasts go through `notify` (`lib/feedback/notify.tsx`). Never use `alert` or `confirm`; use `useConfirm()` (`components/feedback/confirm.tsx`).
- **Forms** use `FormSheet` (`components/form-sheet.tsx`): a sheet on desktop and a drawer on a phone, with a guard against discarding changes. Use react-hook-form with `zodResolver`.
- **Lists** use `DataTable` (`components/data-table.tsx`), which turns into cards on a phone. Cards use `EntityCard` (`components/entity-card.tsx`), and empty lists use `EmptyState`.
- **Sections side by side** share one pattern: a sentence-case `font-heading` title on the page background, status and action on its right, then one framed container (`DocumentSection`). Never put a card around a framed editor or table.
- **Visual language:** quiet surfaces with no decorative gradients, the ⋮ menu in the top-right corner, status next to the name, and the same structure and heights on every card.
- **Conditional JSX** uses a ternary, not `&&`. Lint enforces this.
- **Server components and client-only packages.** `react-phone-number-input` crashes any server component that imports it, so `formatPhone` lives in `lib/utils/phone.ts` (client components only) and `lib/utils/contact.ts` stays plain. Likewise, a server component can't read objects exported from a `"use client"` file (only components): `TYPE_META[type]` is undefined there, so plain data such as session type names lives in its own module (`components/schedule/events/type-labels.ts`).
- **Formatting.** Indent with tabs. The repo has no Prettier, and running `npx prettier` rewrites everything to spaces. Format with `npx eslint --fix <files>`, which also sorts imports and Tailwind classes. In globs, quote `[id]` paths as `[[]id]`. `components/ui/**` is excluded from lint.
- `tailwindcss/no-unnecessary-arbitrary-value` is off on purpose: its autofix turns `opacity-[0.12]` and `scale-[0.98]` into classes Tailwind doesn't generate.

## Public API

`app/api/public/v1/` is the dashboard's only signed-out surface, called by the website (repo `jnaninyoga/jnaninyoga`, a static site on Cloudflare Pages). The spec is [docs/specs/website-from-the-command-center.md](docs/specs/website-from-the-command-center.md).

- `proxy.ts` lets `/api/public/` through; the route guards itself. `POST /requests` checks, in order: the `WEBSITE_ORIGINS` allowlist (CORS), the honeypot and fill time, the form's fields, that `TURNSTILE_SECRET` is set, a rate limit per hashed IP, Turnstile (action `booking`, the website's hostnames), then whether it is an identical resend (same phone, name, choice and message within 10 minutes). Bots and resends are told it worked; only then is it saved.
- Its helpers live in plain modules (`lib/requests/`, `lib/website/`, `lib/notifications/`), never in `"use server"` files: every export of a `"use server"` file is an endpoint anyone can call.
- Never return or log what a visitor sent: a repeated booking answers without the first one's ref, and failures are logged through `withoutVisitorData` (`lib/errors/redact.ts`).
- `GET /events/places?slugs=` (live places, CORS, `Vary: Origin`) and `GET /events/[slug]/photo` serve outdoor sessions the website shows (or showed, once cancelled) only. `POST /requests` takes `choiceKey: "event:<slug>"` with `partySize` (1–10) for an outdoor session on the website whose bookings are still open (they close `BOOKING_CLOSES_HOURS`, 3, before it starts, even for a page built earlier); one that came in when the event was full is kept and marked.
- `GET /site` is what the website builds from (`lib/website/site-data.ts`): Studio hours (open days grouped by the same periods) with their words, the cards on the site, published events. Nothing private goes in it. `GET /api/cron/rebuild-website` needs `Authorization: Bearer $CRON_SECRET`; the proxy lets `/api/cron/` through for it.
- Phone subscriptions only accept the browsers' push services (`isPushServiceEndpoint`), because the server posts to them.
- Locally the website's dev server takes port 3000, so the dashboard runs on 3001 (`pnpm dev` and `pnpm start` use it); set `WEBSITE_ORIGINS=http://localhost:3000` and Cloudflare's always-pass test secret `1x0000000000000000000000000000000AA` (accepted only outside production) in `.env.local`.

## Dependencies

- `next`, `react`, `react-dom`, `motion`, `@animate-ui/react`, `sileo`, `vitest` and `eslint-config-next` are pinned to exact versions. Upgrade them deliberately, and recheck dialogs, menus and toasts in a browser afterwards.
- Majors held back on 2026-11-03, and why:
  - TypeScript 7: typescript-eslint supports TypeScript below 6.1 only.
  - ESLint 10: eslint-plugin-react, -import and -jsx-a11y in `eslint-config-next` only declare support up to ESLint 9.
  - postgres 4: it changes how dates are read and written (UTC instead of session time) and how transactions behave. Upgrading needs a Drizzle check and a run of the money and time code against a real database.
  - TanStack Table 9: an API rewrite that touches `DataTable` and every column definition.
  - `@types/node` stays on 25 while the runtime is Node 24.

## Database

- Schema: `services/database/schema.ts`. Every schema change needs a generated migration (`pnpm db:generate`), and CI's `pnpm db:check` fails without one.
- Migrations were squashed into `0000_baseline` on 2026-11-09, when production was emptied and rebuilt from it. New migrations build on that one.
- The database in `.env` is production. Don't migrate or write to it unless the owner asks. Deploys don't run migrations, so a new migration has to reach production before the code that needs it ships. When code got ahead of the database in Nov 2026, `/clients` crashed and document pages returned 404.
- Work against the local container instead: `jnanin-pg-dev` (postgres:16, port 54329, user `postgres`, password `dev`, database `jnanin`). `.env.local` points `DATABASE_URL` at it and takes precedence over `.env` for `next dev`, `next start` and `pnpm build`. `pnpm db:migrate` only reads `.env`, so it goes to production unless the shell sets `DATABASE_URL`. To migrate the container, run `DATABASE_URL=postgres://postgres:dev@localhost:54329/jnanin pnpm db:migrate`. The container doesn't restart on its own; if the app suddenly blames Google, check that it's still running.
- To run a server action outside Next, use a tsconfig that extends the repo's one. Map `@/*` to the repo and `next/cache` to a stub with no-op `revalidatePath`/`revalidateTag`, then run `npx tsx --tsconfig <it> script.ts` on a CommonJS `.ts` file with an `async function main()`. Warm the connection pool before testing concurrency; otherwise postgres.js pipelines everything on one connection and races never show up.

## Signing in

Who may sign in is the list of Google emails in `AUTH_ALLOWED_EMAILS` (`lib/auth/allowlist.ts`): it's checked when an account would be created and on every request, and an empty list lets nobody in. A production build fails if this or `BETTER_AUTH_SECRET` is missing, so the last good deploy stays live. When teammates arrive, their permissions go in a Data Access Layer built on `requireUser()`. The Google OAuth app is in Testing mode, and only two accounts (the developer's and Ouarda's) can get past Google. Refresh tokens expire after 7 days, so she has to sign in again about once a week. An automated browser can't sign in, so check UI on `/dev/playground` under `next dev`. Signed-out requests to any other page redirect to `/login`.

## Verifying a change

- CI runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:check` and `pnpm build`. Run them before calling work done.
- The dev machine runs out of memory when the dev server, `tsc`, a full lint and a headless browser run together. Run heavy tools one at a time, and stop the dev server before `pnpm build`.
- Check UI changes in a real browser at phone and desktop widths. Before reporting, rate the result honestly against professional standards (hierarchy, alignment, density, motion, accessibility, fit to her day) and iterate until it's a 9 or 10. Compare against patterns users already know, not against your previous version.
- In dev only, the sidebar shows a Radix id hydration warning after file edits. Ignore it unless it also appears in a production build.

## Git and releases

- Current work lands as commits on `epic/command-center-stabilization`, which goes to `main` through one PR (#15). Nothing ships to production until it's verified there.
- The repo has been private since 2026-10-29 but was public before. Check `gh repo view --json visibility` before writing anything sensitive in commits or PRs, and never commit secrets.
