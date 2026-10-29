# Tasks: Schedule, week, client cards, navigation

Plan: [plan.md](plan.md). Every task also clears the project's Definition of Done: tests pass, type-check and lint clean, verified in the running app, signed in.

## Phase 1: client card

- [x] **Task 1: Compact client card in the grid, with health alerts in a toast** (M)
  - Acceptance:
    - At 390×844, at least four cards fit on one screen.
    - The card shows the photo or initial (green dot when checked in today), the name, one line with credits ("6 credits left", amber at 2 or fewer, "No active card" muted) and the session name when checked in. Then a health button (when there are alerts), WhatsApp and call, all 40px; email moves to the ⋮ menu.
    - Tapping the health button raises a sileo warning toast, "Health alerts for {name}", listing conditions with the critical ones first. Tapping the card opens the profile; its buttons don't.
  - Verify: unit tests for the credits line and alert ordering; browser audit at 390 (sizes, text, no sideways scroll); a screenshot.
  - Files: `components/clients/client-card.tsx` (new), `components/clients/grid.tsx`, `components/clients/actions.tsx`, `lib/domain/clients/card.ts` (new) and its test.

- [x] **Task 2: The table's phone view uses the same card** (S)
  - Acceptance: on a phone, the table view shows the same card as the grid; the desktop table is unchanged.
  - Verify: browser at 390 and 1366, `?view=table`.
  - Files: `components/clients/table.tsx`.

### Checkpoint A
- [x] Tests, type-check and lint pass. Show the owner the card at phone width.

## Phase 2: navigation

- [x] **Task 3: Sections in her words, with quick actions** (M)
  - Acceptance:
    - The sidebar shows Today (Dashboard, Check-in), Studio (Schedule, Clients), Billing (Partners, Documents) and Settings (collapsed by default, remembers its state).
    - A "New" button opens the quick actions: new session (opens the sheet on Schedule), add client, sell a card (Clients for now), new quotation.
  - Verify: browser at 1366; keyboard through the menu; the session sheet opens from `/schedule?new=session`.
  - Files: `lib/config/dashboard.ts`, `components/app-sidebar.tsx`, `components/quick-actions.tsx` (new), `components/schedule/client.tsx`.

- [x] **Task 4: Sidebar identity and icon motion** (M)
  - Acceptance:
    - A still Atlas-and-water scene behind the logo, whose only motion is the sun's breathing glow.
    - Icons move briefly on hover and press, and the current page shows the filled icon with a soft accent. Settings opens and closes smoothly.
    - All of it is still under reduced motion. The phone menu opens with no empty band above the logo.
  - Verify: browser light and dark, reduced motion (0 animations in the sidebar), the phone menu screenshot.
  - Files: `components/sidebar-scene.tsx` (new), `components/app-sidebar.tsx`, `app/globals.css`.

- [ ] **Task 5: Phone bottom bar and page titles** (M)
  - Acceptance:
    - Below 768px: a bottom bar with Today, Check-in, +, Clients and Billing, with controls at least 48px, clear of the home indicator. "+" opens the quick actions.
    - Content isn't hidden behind the bar. The header shows the current page's title.
  - Verify: browser at 390 on every main screen (the last item on each page reachable), the audit script.
  - Files: `components/bottom-bar.tsx` (new), `app/(dashboard)/layout.tsx`, `components/page-title.tsx` (new), `lib/config/dashboard.ts`.

### Checkpoint B
- [ ] Tests, type-check and lint pass; production build passes. The owner looks at the new navigation. Push.

## Phase 3: session record

- [ ] **Task 6: Record every session the dashboard creates** (M)
  - Acceptance:
    - The migration adds `studio_sessions` (Google event id, title, type, start, end, status, cancelled at, cancel reason) and `attendance_ledger.cancelled_at`.
    - Creating a session writes its record. `pnpm db:check` passes.
  - Verify: migration applied to the local database; the action harness creates a session record.
  - Files: `services/database/schema.ts`, `services/database/migrations/0008_*.sql`, `lib/actions/schedule/events.ts`.

- [ ] **Task 7: Cancelling keeps the session and gives credits back** (M)
  - Acceptance:
    - Cancel marks the session cancelled, marks its check-ins cancelled and returns one credit per check-in, in one transaction. Then it deletes the Google event; if that fails, everything is rolled back.
    - Cancelling twice changes nothing more. A cancelled session can't take new check-ins.
  - Verify: harness on the local database: refund once, a double cancel, a Google failure rolls back, check-in refused.
  - Files: `lib/actions/schedule/events.ts`, `lib/actions/schedule/attendance.ts`, `lib/domain/schedule/cancel.ts` (new) and its test.

### Checkpoint C
- [ ] Tests pass; the migration and the schema-drift check are clean. Push; the migration is listed as an owner step in the PR.

## Phase 4: feed, Schedule, week

- [ ] **Task 8: Session feed for a range of studio days** (M)
  - Acceptance:
    - Week helpers (Monday of a date, the seven days, the range as instants) are tested across the Ramadan changes and a year boundary.
    - `getEventsBetween` makes one Google request. The feed merges Google events, our cancelled sessions and check-in counts (cancelled check-ins excluded).
  - Verify: unit tests; a harness run with real check-ins.
  - Files: `lib/utils/time.ts` and its test, `services/google/calendar.service.ts`, `lib/actions/schedule/feed.ts` (new).

- [ ] **Task 9: Schedule page with any week** (M)
  - Acceptance: spec criteria 1 to 4 (title, week navigation in the URL, past sessions with counts opening their history, cancelled sessions marked, type filter, empty state).
  - Verify: browser at 390 and 1366, the back button, a past week with check-ins, Google unavailable.
  - Files: `app/(dashboard)/schedule/page.tsx`, `components/schedule/client.tsx`, `components/schedule/week-nav.tsx` (new).

- [ ] **Task 10: This week on the dashboard** (M)
  - Acceptance: spec criterion 5. Today's agenda uses the studio day. The seven-day strip shows sessions and check-ins per day and matches Schedule for the same week. Tapping a day lists its sessions; there is a summary line and a link to Schedule.
  - Verify: browser on a week with sessions; counts compared with Schedule.
  - Files: `app/(dashboard)/page.tsx`, `components/dashboard/week-strip.tsx` (new), `components/dashboard/cockpit/client.tsx`.

### Checkpoint D
- [ ] Every success criterion in the spec is met; tests, build and audit pass. Owner review, push.
