# Spec: Schedule, the week on the dashboard, client cards and navigation

Status: approved 2026-10-29, with the owner's decisions below.

## Capability map

| Module id | Responsibility | Depends on |
| --- | --- | --- |
| `session-record` | Our own record of every session the dashboard creates, so cancelling marks it cancelled (and its check-ins) instead of erasing it | — |
| `session-feed` | Sessions for a range of studio days: the Google Calendar events, our cancelled sessions, and our check-in records, with day and week boundaries in Marrakech time | `session-record` |
| `schedule-history` | The Schedule page: any week, past or future, with what happened in past sessions | `session-feed` |
| `home-week` | The dashboard: this week's work at a glance, next to today | `session-feed` |
| `client-card` | One compact client card for the clients list, on phone and desktop | — |
| `navigation` | The sidebar (desktop, and the phone menu) and the phone bottom bar, in the studio's identity | — |

Build order: `client-card` and `navigation` are independent and go first; then `session-record`, `session-feed`, and finally `schedule-history` and `home-week`.

## Objective

The operator runs the studio from her phone. Today the Schedule page is a "Weekly Schedule" that only looks 7 days ahead: she can't look back at past sessions, and the dashboard shows only today.

- **Schedule** becomes the whole schedule: every week, past and future. A past session shows who came.
- **The dashboard** shows the week she is working through: what happened, what's coming, today first.
- **Client cards** show what she needs at the door at a glance, so a phone fits several clients, not one and a half.

### User stories

- When a client asks "did I come last Tuesday?", she opens Schedule, goes back a week and sees who checked in to that class.
- When she plans next week, she moves forward a week and sees what's booked.
- When she opens the dashboard on Monday morning, she sees today's sessions and how the week is filling up.

## Module: `session-record`

Today, cancelling a session deletes the event from Google Calendar, so it vanishes from any history while its check-ins stay orphaned in our records.

- A local table records each session the dashboard creates: the Google event id, title, type, start, end, and a status (scheduled or cancelled), with when and why it was cancelled.
- **Cancelling** marks the session cancelled and still removes it from Google Calendar, so the time slot frees up and invited guests are told. The session stays in history, shown as cancelled.
- **Check-ins of a cancelled session** are marked cancelled, not deleted, and each client gets the credit back on the card it came from. Both happen in one transaction with the session's cancellation.
- Sessions created before this change, or directly in Google Calendar, have no local record: their history comes from Google, as today.
- Migration: one new table, plus a "cancelled at" column on check-ins. Run locally first; production is the owner's step.

## Module: `session-feed`

- One server function returns the sessions between two studio dates: one Google Calendar call for the whole range, plus our cancelled sessions in that range, plus one database query for the check-ins of those sessions.
- **Every event in her calendar is shown**, including ones the dashboard didn't create.
- Days and weeks are computed in Marrakech time (`Africa/Casablanca`). A week runs Monday to Sunday. This also fixes "today" being computed on the server's clock.
- Each session carries its type, start, end, title, and, from our records, how many people checked in.
- It is wrapped in `withGoogle` and `requireUser`, like every Google read.

## Module: `schedule-history`

- The page title is **Schedule**. The sidebar label stays "Schedule".
- It shows one week at a time, as a list grouped by day (built for a phone; no month grid). It opens on the current week, so the earlier days of this week are visible too.
- **Previous week**, **This week** and **Next week** controls. There's no limit on how far back or forward she can go.
- The week is in the URL (`/schedule?week=2026-10-26`), so the back button and links work.
- **Past sessions** show the check-in count. Tapping one opens its check-in page in its existing read-only history mode.
- **Upcoming sessions** look as they do today (guests, check-in, cancel).
- A filter by type: group, private, outdoor, B2B.
- An empty week shows the shared empty state, with "New session" for current and future weeks.

## Module: `home-week`

- Today's agenda stays first, unchanged.
- Below it, **This week**: seven days, Monday to Sunday. Each day shows its number of sessions, and today is marked.
- Tapping a day shows that day's sessions underneath.
- One summary line: "9 sessions this week, 31 check-ins so far". Check-ins count because the week is measured by the clients who came. No charts.
- A link, "Open the full schedule", goes to Schedule on the same week.

## Module: `client-card`

Today a card is about 350px tall for one client. It gives as much room to gender and "category discount" as to what she uses: credits left, today's check-in, a health warning, WhatsApp. A first compact version (118px) was too cramped. The owner asked for a premium card with room to breathe (2026-10-29), so density gives way to clarity.

- **Header:** the photo (56px) with a green dot when checked in today, the name in large type, and one status chip ("Checked in · {session}") when it applies.
- **A tinted panel** with the two numbers she needs at the door:
  - **Credits left:** "6 of 10" (amber when 2 or fewer), or "No active card".
  - **Last visit:** "Today", "Yesterday" or "Tue 28 Oct", in Marrakech time.
- **Health:** a soft red "1 health alert" chip when there are active alerts. Tapping it raises a sileo warning toast, "Health alerts for {name}", listing the conditions with the critical ones first.
- **One detail row:** client since (date).
- **Actions:** a round ⋮ (edit, email, delete), a round call button and a wide WhatsApp pill as the main action; all at least 44px.
- **Tapping the card** opens the profile; its buttons don't.
- **One component** serves the grid view and the table's phone cards.
- Gender, category and membership details stay on the profile. When membership cards get an expiry date (a separate, promised change), the panel adds it.

## Module: `navigation`

One navigation system. On a phone the bottom bar carries the daily work and the side menu holds the rest. On a desktop the sidebar carries everything.

- **Sections named after her work**, not admin categories:
  - **Today:** Dashboard, Check-in.
  - **Studio:** Schedule, Clients.
  - **Billing:** Partners, Documents.
  - **Settings:** company, memberships, categories, B2B pricing and studio hours, collapsed by default.
- **Quick actions**, in place of the "Quick Actions" group: a "New" button at the top of the sidebar (desktop) and the bottom bar's "+" (phone). Both open the same short list: new session, add client, sell a card, new quotation.
- **Phone bottom bar:** Today, Check-in, +, Clients, Billing. Each item is at least 48px tall and clears the phone's home indicator (safe area). The page header shows the page's title.
- **Identity:** a small still version of the sign-in scene (the Atlas ranges and the water line, in the brand's colours) behind the logo at the top of the sidebar. Its only motion is the sun's glow breathing slowly. No falling petals or birds there: the sidebar is a working surface, and constant motion at the edge of her eye pulls attention from the page.
- **Icons that answer her:**
  - Hovering or pressing an item gives its icon a short, small move (under 300ms).
  - The current page's icon switches to its filled style with a soft accent behind it.
  - Opening and closing Settings animates the chevron and the list's height.
  - All of it is still under reduced motion.
- **Fixes:** the empty band above the logo in the phone menu; the user footer stays clear of the screen edge.

## Commands

```bash
pnpm dev                      # local, with .env.local pointing at the local database
pnpm test                     # vitest (lib/ and services/)
pnpm typecheck                # cap the heap on this machine: NODE_OPTIONS=--max-old-space-size=2500
pnpm exec eslint <files>      # lint changed files
```

## Project structure

- `lib/utils/time.ts`: studio week math (Monday of a date, the seven days of a week, the range as instants), tested next to it.
- `services/google/calendar.service.ts`: one `getEventsBetween(token, start, end)` replacing the today and upcoming fetches.
- `lib/actions/schedule/`: the session feed (events plus check-in counts).
- `app/(dashboard)/schedule/page.tsx` and `components/schedule/`: the Schedule page.
- `app/(dashboard)/page.tsx` and `components/dashboard/`: the week strip.

## Code style

The existing patterns: studio time helpers, `withGoogle` for Google reads, `requireUser` in every action, `EmptyState`, iconsax icons, sentence-case copy, controls at least 40px, text at least 12px.

## Testing strategy

- **Unit (vitest):** week boundaries in Marrakech time, including weeks that cross the Ramadan clock changes and the end of a year; grouping sessions by studio day.
- **Local database (action harness):** check-in counts per session for a range.
- **Browser, signed in, phone and desktop width:** week navigation, URL, filter, a past session opening its history, the home strip's counts matching Schedule for the same week, no sideways scroll, and Google unavailable showing the shared message.

## Boundaries

- **Always:** studio time helpers, `withGoogle`, `requireUser`, the shared empty state and badges, the local database only.
- **Ask first:** hiding events the dashboard didn't create; keeping cancelled sessions in the history (it needs them stored locally, which is a schema change); any other schema change.
- **Never:** change or delete Google events from the history view; query the production database.

## Success criteria

Schedule and dashboard:

1. `/schedule` is titled "Schedule" and opens on the current Monday-to-Sunday week in Marrakech time, past days included.
2. Previous and next week work without limit; the URL holds the week; "This week" returns to it.
3. A past session shows its check-in count; tapping it opens its read-only check-in history.
4. The type filter narrows the list; an empty week shows the shared empty state.
5. The dashboard shows today's agenda, then a seven-day strip. Each day's count matches Schedule for the same week, today is marked, and tapping a day lists its sessions.
6. One Google Calendar request per page view, whatever the number of days.
7. At 390px wide: no sideways scroll, controls at least 40px, new text at least 12px.
8. Week math is unit-tested, including the Ramadan clock changes and a week spanning two years.

Navigation:

13. The sidebar shows the sections Today, Studio, Billing and Settings (collapsed); there is no "Platform" or "Quick Actions" group.
14. On a 390px screen, the bottom bar shows Today, Check-in, +, Clients and Billing, with controls at least 48px, above the home indicator. "+" offers the four quick actions.
15. The phone menu opens with the logo at the top, with no empty band.
16. The sidebar scene is still under reduced motion, and its only motion otherwise is the sun's glow.

Client cards:

9. At 390px wide, a card shows the name in full (wrapping if long), the credits and last visit at a glance, and its actions without crowding: controls at least 44px, padding at least 20px.
10. Tapping the health warning raises a sileo toast listing that client's active alerts, critical first.
11. The grid and the table's phone view use the same card; tapping a card opens the profile, and its buttons don't.
12. Every control on the card is at least 44px and every text at least 12px.

## Decisions (owner, 2026-10-29)

1. Show every event in her calendar, with history.
2. Cancelled sessions are kept: a local record marked cancelled, and their check-ins marked cancelled. No more erasing.
3. The week strip counts check-ins as well as sessions.
4. The client card keeps WhatsApp and call; email goes in the ⋮ menu.
5. Category and membership details appear only on the profile.
6. Section names Today, Studio, Billing, Settings; sidebar motion limited to the breathing glow and touch responses (proposed, not objected to).
7. Cancelling a session with check-ins gives each client the credit back; the check-ins stay in history, marked cancelled.
