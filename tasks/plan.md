# Implementation Plan: Schedule, week, client cards, navigation

Spec: [docs/specs/schedule-and-week.md](../docs/specs/schedule-and-week.md). Tasks: [tasks/todo.md](todo.md).

## Overview

Five modules in dependency order. The two independent ones (`client-card`, `navigation`) go first because she uses them every hour. Then the session record (the only schema change), the feed built on it, and the two views that read the feed.

## Architecture decisions

- **One client card component** for the grid and the table's phone view: a single place to get the card right.
- **Health alerts raise a sileo toast** (`notify.warning`), not a popover or tooltip. Toasts are the app's one voice for messages, and they work on touch.
- **Quick actions are one list** reused by the sidebar's "New" button and the bottom bar's "+".
- **A local `studio_sessions` table** records sessions the dashboard creates. Google stays the calendar of record for active events; our table is the record of cancellations. History merges both.
- **Cancelling is one database transaction**: mark the session cancelled, mark its check-ins cancelled, and give each credit back, with wallets locked FOR UPDATE. The Google event is deleted after the transaction commits. If that deletion fails, the cancellation is rolled back, so we never record a cancellation that didn't happen.
- **Weeks are Monday to Sunday in Marrakech time**, computed by tested helpers in `lib/utils/time.ts`. "Today" stops using the server's clock.
- **One Google request per view**, `getEventsBetween(start, end)`, replacing the today and upcoming fetches.

## Task list

See [todo.md](todo.md): ten tasks in four phases, with a checkpoint after each phase.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Google deletion fails after the database records a cancellation | High: history says cancelled, the calendar still has the class | Delete from Google after the commit, and roll the cancellation back if it fails; a harness test covers both paths |
| Refunding twice (a double tap on Cancel) | High: credits created from nothing | Cancelled check-ins aren't counted again; the transaction locks the wallets; an idempotency test |
| Production runs the new code before the migration | High: the session pages fail | The migration ships with the code; the owner runs it before deploying; the schema-drift check in CI |
| Memory on the dev machine | Medium: checks killed | Capped type-check, one heavy tool at a time |
| The bottom bar covers page content or toasts | Medium | Bottom padding on the content; toasts sit at the top on phones |

## Open questions

None: decisions are recorded in the spec.
