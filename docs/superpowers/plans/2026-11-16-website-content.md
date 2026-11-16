# Website content (slice 2: class times and cards) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouarda sets the website's class times and which membership cards it shows (with prices) in the dashboard, and the site shows them after a rebuild a couple of minutes later.

**Architecture:** The dashboard owns the facts and their wording. `GET /api/public/v1/site` returns class times (with FR/EN wording made by a tested domain function), the cards on the site, and `events: []` (filled by slice 3). The website runs `scripts/site-data.mjs` before `dev` and `build`: it fetches `SITE_API_URL` into `src/content/live.json` (git-ignored), or copies the committed `src/content/snapshot.json` when no URL is set; a failed fetch fails the build. `src/content/site.ts` derives `plans`, `slots`, `slotDays` from it, so every existing import keeps working. Saves that change what the site shows call Cloudflare's deploy hook; a daily Vercel cron also rebuilds.

**Tech Stack:** as slice 1. Website: Next 16 static export, no test runner (wording is tested in the dashboard).

**Spec:** [docs/specs/website-from-the-command-center.md](../../specs/website-from-the-command-center.md), sections 1 (cards on the site, class times), 2 (`GET /site`), 4 (Memberships, Class times, Rebuilding the site), 5 (Reading the data at build time, derived facts), 6 item 2.

## Global Constraints

- Branches: dashboard `feat/website-content` from `feat/website-bookings`; website `feat/website-content` from `feat/bookings-to-dashboard`. Local only, no push.
- AGENTS.md conventions (tabs, eslint --fix, requireUser in `"use server"`, logServerError + `{error, ref}`, ternaries, mobile first, `<Money>` in the dashboard). Public helpers in plain modules.
- Migration `0004` applied to the local container only.
- The switch-over must not change the site: with the snapshot (no API), the built site states the same days, times, cards and prices as today.
- Never hard-code a UTC offset. Times are wall-clock `HH:mm` strings.

## Review Focus

1. **No class times saved yet** must still give today's timetable (Mon/Thu, six slots), not an empty site. → T2 `DEFAULT_CLASS_TIMES`, T3 test.
2. **A card taken off the site, archived, or without a key** must not appear in `GET /site`. → T2 `siteCards` tests.
3. **Odd timetables** (one day, seven days, one time, no times) must read naturally in both languages. → T2 `timetableWords` tests.
4. **A class outside studio hours** is refused with a clear reason, using the default hours when none are saved. → T2 `classTimesProblems` tests.
5. **The deploy hook missing or failing** never blocks the save; she's told the website didn't update. → T4 tests.

---

### Task 1: Card fields for the website (schema)

**Files:** Modify `services/database/schema.ts` (`products`); create migration `0004_website_cards.sql`.

- `siteKey` text unique (nullable), `onSite` boolean not null default false, `sitePosition` integer not null default 0, `popular` boolean not null default false.
- [ ] Branch `feat/website-content`; edit schema; `pnpm db:generate --name website_cards`; apply to the local container; commit; `pnpm db:check` → 0.

### Task 2: The website's facts (pure, tested) — `lib/domain/website/`

**Files:** `timetable.ts`, `cards.ts`, `payload.ts` + tests.

- `type ClassTime = { start: string; end: string }`; `type ClassTimes = { days: number[]; times: ClassTime[] }` (days: Date.getDay numbering).
- `DEFAULT_CLASS_TIMES`: days `[1, 4]`, times 08:30–10:00, 10:30–12:00, 12:30–14:00, 15:30–17:00, 17:30–19:00, 19:30–21:00.
- `normalizeClassTimes(ct): ClassTimes` — days unique and in week order Monday→Sunday; times sorted by start.
- `classTimesProblems(ct, hours: WorkingHoursConfig): string[]` — "End after it starts" per time, overlaps ("8:30–10:00 overlaps 9:30–11:00"), and each time inside each chosen day's studio hours ("Thursday closes at 20:00: 19:30–21:00 doesn't fit. Change Studio hours first."), closed day ("The studio is closed on Saturday").
- `timetableWords(ct): { fr: Words; en: Words }`, `Words = { headline; daysAnd; daysOr }`. Exact values:
  - Mon+Thu, 6 times → fr `{ headline: "Lundi et jeudi, six rendez-vous.", daysAnd: "lundi et jeudi", daysOr: "lundi ou jeudi" }`, en `{ headline: "Mondays and Thursdays, six sessions.", daysAnd: "Monday and Thursday", daysOr: "Monday or Thursday" }`.
  - One day, one time → fr "Le mercredi, un rendez-vous." / en "Wednesdays, one session."
  - Three days → fr "Lundi, mercredi et vendredi, …" / en "Mondays, Wednesdays and Fridays, …".
  - Seven days → fr "Tous les jours, …" / en "Every day, …"; daysAnd fr "tous les jours", en "every day".
  - No times or no days → fr headline "Sur rendez-vous." / en "By appointment."
  - Numbers one to twelve in words (fr un/deux…douze, en one…twelve), digits above.
- `siteCards(products): SiteCard[]` with `SiteCard = { key; name; credits; months: number | null; price: number; popular: boolean }` — only `kind = membership`, `onSite`, not archived, with a `siteKey`; ordered by `sitePosition`, then price.
- `isSiteKey(key)`: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, ≤ 40 chars.
- `sitePayload({ classTimes, products, now })` → `{ version: 1, generatedAt, classTimes: { days, times, words }, cards, events: [] }`.

### Task 3: Class times setting (validator, actions)

**Files:** `lib/validators/class-times.ts`, `lib/actions/website.ts` (`"use server"`), `lib/website/site-data.ts` (plain).

- `getClassTimes(): Promise<ClassTimes>` (requireUser) — the saved `app_settings.class_times` or `DEFAULT_CLASS_TIMES`.
- `saveClassTimesAction(data): Promise<{ success?: true; error?: string; ref?: string; website?: RebuildOutcome }>` — zod shape, `normalizeClassTimes`, `classTimesProblems` against `getWorkingHours() ?? DEFAULT_HOURS` (first problem is the error), upsert, revalidate `/website/class-times`, then `requestSiteRebuild("class times")`.
- `loadSitePayload()` in `lib/website/site-data.ts` (no auth; used by the public route): reads class times + products, returns `sitePayload(...)`.

### Task 4: Rebuilding the website

**Files:** `lib/website/rebuild.ts` + test; `app/api/cron/rebuild-website/route.ts`; `vercel.json`; `proxy.ts`.

- `type RebuildOutcome = "requested" | "not_configured" | "failed"`; `requestSiteRebuild(reason: string, fetchImpl = fetch): Promise<RebuildOutcome>` — POST `SITE_DEPLOY_HOOK_URL`, 10 s timeout; non-2xx or throw → `"failed"` (logged with `logServerError`); unset → `"not_configured"`.
- Cron: `GET` with `Authorization: Bearer ${CRON_SECRET}` → rebuild; anything else 401. `vercel.json` `{ "crons": [{ "path": "/api/cron/rebuild-website", "schedule": "0 3 * * *" }] }`. Proxy lets `/api/cron/` through.
- Client message helper `websiteToast(outcome)` in `lib/feedback/website.ts`: requested → "On the website in about 2 minutes"; failed → warning "Saved. The website didn't update: try again in a minute."; not_configured → nothing extra.

### Task 5: `GET /api/public/v1/site`

**Files:** `app/api/public/v1/site/route.ts`.

- `GET` → `Response.json(await loadSitePayload(), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } })`; failure → 500 `{ error, ref }` via `withoutVisitorData`-free `logServerError`. `export const dynamic = "force-dynamic"`.
- Verify with curl on the dashboard dev server.

### Task 6: Memberships on the website (sheet, actions, badge)

**Files:** `lib/validators/product.ts`, `lib/actions/price-list.ts`, `components/price-list/product-sheet.tsx`, the membership card in `components/price-list/`.

- Membership schema gains `onSite: boolean`, `siteKey: string` (trimmed, lowercased; required and `isSiteKey` when `onSite`), `sitePosition: number` (int ≥ 0), `popular: boolean`.
- `rowOf` stores them (`siteKey` null when empty). A duplicate key → "Another card already uses the key …". Saving or archiving a card that is or was on the site calls `requestSiteRebuild` and returns `website`.
- Sheet: a "On the website" fieldset (Switch "Show on jnaninyoga.com", key with hint "Used in links: start-to-align", position, Switch "Popular badge"), shown for memberships only. The card shows a small "On the website" badge.
- Local seed: the five cards with today's names, prices, credits, months and keys, on the site.

### Task 7: Class times page and the Website section

**Files:** `app/(dashboard)/website/class-times/page.tsx`, `components/website/class-times-form.tsx`, `lib/config/dashboard.ts` (+ test).

- Nav section **Website** after Price list: `{ title: "Class times", url: "/website/class-times", icon: Clock }`.
- Form (autosave like Studio hours): seven day toggles, a list of times (start, end, remove), "Add a time", the problems shown inline, and a preview card with the FR and EN headline as the site will show it. After a save that requested a rebuild, the status says "On the website in about 2 minutes".

### Task 8: Docs

- `.env.example`: `SITE_DEPLOY_HOOK_URL`, `CRON_SECRET`. AGENTS.md: the Website section, `GET /site`, rebuilds.

### Task W1–W4: The website reads the data

- **W1** `scripts/site-data.mjs`, `src/content/snapshot.json` (today's facts + words), `.gitignore` `src/content/live.json`, `package.json` `predev`/`prebuild`.
- **W2** `src/content/site.ts` derives `plans` (`id` = key, `sessions` = credits, `months` = null when credits is 1), `slots` (`id` like `8h30`), `slotDays`, `words`; `formatTimes` helpers.
- **W3** Derived copy: day arc title and its morning/evening split and arc range; `slotPrefix` days; classes meta description (FR/EN) and home description if it states facts; JSON-LD opening hours and `priceRange`; `llms.txt` as a static route.
- **W4** README / docs: `SITE_API_URL`, the deploy hook. Verify: build with the snapshot (diff of facts = none), then build against the local dashboard, after changing a price there.
