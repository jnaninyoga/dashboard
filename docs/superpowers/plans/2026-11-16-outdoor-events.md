# Outdoor events (slice 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ouarda writes up an outdoor event in the dashboard and publishes it. The website advertises it in a sticky marquee and on its own page, takes bookings for it (with places counted when she sets a limit), and she keeps the list of who's coming and who has paid.

**Architecture:** An `events` table (with its photo in `event_photos`) and event fields on `booking_requests` (`event_id`, `party_size`, `source`, `paid_at`, `arrived_when_full`). Rules are pure functions in `lib/domain/events/`. `GET /site` adds published and cancelled events; `GET /api/public/v1/events/places` gives live places; `GET /api/public/v1/events/[slug]/photo` serves the photo. `POST /requests` accepts `choiceKey: "event:<slug>"` with a party size. Confirming, adding a reservation by hand and lowering the limit lock the event row (`SELECT … FOR UPDATE`). Publishing, editing and cancelling rebuild the site; publishing also puts the event in her Google Calendar as an outdoor session, best effort.

**Spec:** [docs/specs/website-from-the-command-center.md](../../specs/website-from-the-command-center.md), sections 1 (Events, booking requests), 2, 4 (Events, Publishing an event), 5 (marquee, Events pages, booking form), 6 item 3.

## Rulings made for this plan (the owner was away)

- **Events can last several days.** The open question (a weekend retreat?) wasn't answered, so an event has a start and an end date-time; a morning event simply has both on one day.
- **Photos are stored in the database** (`event_photos`, one WebP per event, resized in her browser to at most 1600px) and served by the public API with long caching. No new storage service or account; a few dozen photos fit easily. Moving them to object storage later only changes the photo route.
- **Party size is capped at 10** per website booking; she can add bigger groups by hand.

## Global Constraints

- Branches: dashboard `feat/outdoor-events` from `feat/website-content`; website `feat/outdoor-events` from `feat/website-content`. Local only.
- Migration `0005` on the local container only. Never touch production, and never call Google Calendar while testing (the harness stubs `@/services/google`).
- Event text: French title and description required; English optional, with the Google Translate link when empty.
- Times: the form takes studio wall-clock date and time (`fromStudioTime`); the site formats instants in its `TIME_ZONE`.

## Review Focus

1. **Two confirmations racing for the last place** — only one wins. → the confirm action locks the event row; harness check with a warmed pool.
2. **A booking for an event that started, was cancelled or is a draft** is refused by the endpoint, even from a stale page.
3. **A full event still receives a request** from a stale page → saved, marked "arrived when full", never confirmed past the limit.
4. **Lowering the limit below the confirmed places** is refused with the numbers.
5. **Drafts never reach the website** (`GET /site`, places, photo).

## Tasks

- **E1 Schema**: `event_status` (`draft | published | cancelled`), `booking_source` (`website | whatsapp | phone | in_person`), `booking_request_kind` + `event`; `events`, `event_photos`; `booking_requests` + `event_id` (FK, set null), `party_size` (default 1), `source` (default website), `paid_at`, `arrived_when_full`. Migration `0005_outdoor_events`.
- **E2 Domain** (`lib/domain/events/`, tested): `slugify`, `uniqueSlug`; `places({capacity}, confirmedPeople)`; `canTake(capacity, confirmed, partySize)`; `capacityProblem(newCapacity, confirmed)`; `eventProblems(input)` (FR title and description required, end after start, price ≥ 0, capacity ≥ 1 when set, party ≤ 10); `englishMissing`; `googleTranslateUrl(text)`; `siteEvents(events, now)` (published and cancelled-after-publish, never drafts; upcoming first); `eventPhase(event, now)` (`upcoming | ongoing | past | cancelled`).
- **E3 Actions** (`lib/actions/events.ts`): list, get with reservations, save (create or update; draft or published), publish, cancel (reason), upload photo (FormData, WebP ≤ 1 MB), add reservation by hand, set reservation status (with the lock), set paid, change the limit. Rebuild on publish, edit of a published event and cancel. Calendar: create on first publish, update on a time change, cancel on cancel; failures are reported, never block.
- **E4 Public API**: `GET /site` events; `GET /events/places?slugs=`; `GET /events/[slug]/photo`; `POST /requests` events (`event:<slug>`, `partySize`).
- **E5 Bookings page**: event bookings show the event and party size; confirming one checks places.
- **E6 Screens**: Website → Events: list, new, event page (form, Publish, Cancel, reservations with Paid ticks and Add reservation).
- **S1–S6 Website**: events in `live.json`; `/evenements/` + `/en/events/` list and one page per event (`generateStaticParams`, JSON-LD Event, sitemap); live places; sticky marquee on every page while an event is upcoming (pauses on hover/focus, still under reduced motion and the site's pause, hides events that started); booking form event choices with party size and `?evenement=`; CSP `img-src` for the dashboard; menu link.
