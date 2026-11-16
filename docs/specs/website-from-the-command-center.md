# Design: the website runs from the Command Center

Status: approved by the owner, 2026-11-16. Slice 1 (Bookings) built on branch `feat/website-bookings`.

Two repositories are involved:

- **The dashboard** (this repo, "Ouarda's Digital Command Center"): Next.js 16 on Vercel at `dash.jnaninyoga.com`, Postgres on Supabase, sign-in with Better Auth.
- **The website** (`/home/whybe/projects/jnaninyoga`, GitHub `jnaninyoga/jnaninyoga`): Next.js 16 as a static export (`output: "export"`) on Cloudflare Pages, French at the root and English under `/en/`. It's live at `jnaninyoga.pages.dev` with `noindex`, and `jnaninyoga.com` still serves the old WordPress site.

## Why

Everything the website says about the studio's offer is typed into its code. `src/content/site.ts` holds the five cards and their prices, the six slots and the days they run on. `src/content/fr.ts`, `src/content/en.ts` and `public/llms.txt` repeat those facts in sentences. Changing a price or a class time means a developer and a redeploy. The booking form is meant to send an email through Cloudflare, but that was never set up (it needs a $5/month plan), so today it only offers WhatsApp.

Ouarda runs the studio alone, from her phone. The owner wants the Command Center to be the one place the site's changing content comes from, and the one place every booking lands:

- **Class times:** the weekly timetable on the site.
- **Cards and prices:** the cards shown on the site, which are the memberships she already sells in the dashboard.
- **Outdoor events:** she publishes them from the dashboard. A sticky marquee advertises them on every page of the site, and they have a dedicated Events page.
- **Booking:** every booking made on the site is centralized in the Command Center.

## Goals

1. She changes class times, a card's price or which cards the site shows, and the site shows it within a few minutes, with no developer involved.
2. She publishes an outdoor event. While it's upcoming, a sticky marquee advertises it on every page, and it has its own page on the site.
3. Every booking from the site (a class, a card, an event, or "not sure yet") lands in the dashboard, and she can't miss it: a notification on her phone, an email to `contact@jnaninyoga.com`, and a count in the dashboard.
4. For an event with a limited number of places, the site shows the places left and then "Full". For each event she keeps a list of who reserved and ticks who has paid.

## Non-goals

- **Online payment.** There is no payment gateway. People pay her in cash or by transfer, and she ticks it herself.
- **Built-in translation.** No AI translation. She writes event text in both languages, with help described below.
- **Editing any other site text from the dashboard.** That covers the page copy, the cards' bullet lines, photos and contact details.
- **Real-time class booking.** Visitors don't pick a dated class with live availability; a class booking stays a request she confirms. Only events count places.
- **Visitor accounts, or any link between the site and her Google Calendar.** The site has nothing to do with her calendar.
- **Charts, roles or multi-user features** in the dashboard (see AGENTS.md).

## Anti-goals (failures even if it "works")

- **A booking lost silently.** A request is saved before anything else happens. A failed notification never loses it.
- **The site breaking or showing empty prices because the dashboard is down.** The site reads the dashboard while it builds, and a failed build leaves the last good site live.
- **Leaks.** Draft events, archived cards or anyone's personal data appearing in the public API.
- **Overbooking a limited event** because two confirmations raced each other.
- **A marquee that nags,** or anything that breaks the site's design system (`DESIGN.md` in the website repo).
- **Writing to the production database during development** (AGENTS.md).

## Constraints

- **The website is static.** Its HTML is produced at build time. Anything it shows without JavaScript has to be known when it builds.
- **The dashboard has no public surface today.** `proxy.ts` sends everything to `/login` except auth, the PWA files and the dev playground. AGENTS.md's rule that every server action starts with `requireUser()` stays. The public part is new route handlers, not server actions.
- **Production database.** `.env` points at production. A new migration has to reach production (the owner's step) before the code that needs it ships. Work against the local container `jnanin-pg-dev`.
- **Time.** Studio time is `Africa/Casablanca`, and Morocco has been on UTC+0 since 2026-09-20. The dashboard uses `lib/utils/time.ts`, and the site names the zone directly (`TIME_ZONE` in `site.ts`). Never hard-code an offset. The API sends instants as ISO strings with an offset, and timetable times as wall-clock `HH:mm`.
- **Money.** The dashboard shows MAD through `<Money>` and `formatMoney`. The site shows "Dh" through its own `formatPrice`. The API sends prices as numbers of dirhams, and each app formats them its own way.
- **Hosting.** The dashboard stays on Vercel. The site stays on Cloudflare Pages: Cloudflare's free plan was measured too small for server-rendered Next.js.

## Approaches considered

All three use an API published by the dashboard. They differ in **when** the site calls it.

1. **At build time, with a rebuild when she saves, plus live calls for what changes by the minute.** *Chosen.* Prices, times and events are real HTML: Google indexes them, events can appear in search as Event results, and nothing jumps while the page loads. A save reaches the site in about 2–3 minutes. Places left and sending a booking are live calls from the visitor's browser. If the dashboard is down during a build, the build fails and the previous site stays live.
2. **Everything live from the visitor's browser.** Changes show instantly. But the HTML has no prices or events, so Google sees empty sections and the page jumps. Every visit also reaches the production database, and if the dashboard is down the site shows no prices.
3. **A server-rendered site.** Instant and indexed, but it changes how the site is hosted ($5/month on Cloudflare, or moving the site to Vercel). That's too much for content that changes a few times a month.

The owner chose approach 1, with the two apps talking only through the API.

## What the owner decided

- **Outdoor events are outdoor sessions** (correction, 2026-11-16, after slice 3 was first built as a separate events table). Creating an outdoor session in Schedule creates the event; its website part (text, place, photo, limit, "Show on the website") belongs to the session, edited on the session's page. Nothing is entered twice. Where the sections below say "event", read "outdoor session".

- The dashboard manages the site's class times, cards and prices, outdoor events, and bookings.
- Outdoor events get a sticky marquee on the site while one is published, plus a dedicated Events page.
- All bookings are centralized in the dashboard.
- The number of places is **optional, per event**. With a limit, a request takes a place only once she confirms it, and the site shows places left, then "Full". Without a limit, there's no count.
- **Outdoor events are a paid extra,** for clients with a card and without one, and cards never pay for them. This already holds in the dashboard: check-in takes no credit for outdoor sessions. Each event lists who reserved, and she ticks "Paid" herself.
- **She hears about a new booking three ways:** a phone notification, an email, and the count in the dashboard.
- **Two languages only for event text.** She writes both. If the English is empty, the form warns her and links to Google Translate. Everything else is one language: card names, prices, credits, months and times.
- No AI translation, and no payment gateway.

## The design

### 1. Data (dashboard database)

All of it lives in `services/database/schema.ts`, with one generated migration per slice.

**Cards on the site.** These are new columns on `products`, used only by `kind = 'membership'`:

- `site_key`: text, unique, nullable. The card's stable id on the site. It's used in links (`?carnet=start-to-align`) and to find the card's bullet lines in the site copy. The five existing keys are `seance`, `start-to-align`, `graceful-reset`, `flow-and-flourish` and `elevate-and-evolve`.
- `on_site`: boolean, default false.
- `site_position`: integer, the order on the site.
- `popular`: boolean, default false. At most one card is popular.

The site shows the product's `name`, `credits`, `duration_months` and `price` as they are. One name serves both the till and the site.

**Class times.** One `app_settings` row, `class_times`, holding JSON in the same pattern as `working_hours`: `{ days: number[], times: { start: "HH:mm", end: "HH:mm" }[] }`. `days` uses Date.getDay numbering, the same as the site's `slotDays`. It's validated by a Zod schema in `lib/validators/`. Every time has to fall inside the studio hours of every chosen day (see `lib/actions/settings.ts`, `getWorkingHours`), and times can't overlap.

**Events.** A new table, `events`:

- `id` (uuid) and `slug`. The slug comes from the French title, is unique, and never changes after the first publish, because the URL may already have been shared.
- `title_fr` (required) and `title_en` (nullable).
- `description_fr` (required) and `description_en` (nullable).
- `starts_at` and `ends_at` (timestamps).
- `place_name` and `place_maps_url` (nullable).
- `price` (decimal; 0 means free).
- `capacity` (nullable integer; empty means unlimited).
- `photo_url` (nullable).
- `status`: enum `draft | published | cancelled`, with `published_at`, `cancelled_at` and `cancel_reason`.
- `google_event_id` (nullable; see "Publishing an event").
- `created_at`.
- Checks: the end is after the start, the price is at least 0, and the capacity is at least 1 when set.

**Booking requests.** A new table, `booking_requests`:

- `id`, and `ref`, the code visitors and she can quote (`WEB-XXXXXXXX`, the same shape as today's function).
- `kind`: enum `card | class | event | other`.
- `product_id` (nullable), `class_time` (nullable text, e.g. `08:30`) and `event_id` (nullable). They record what the visitor chose, so a later price change doesn't rewrite the request.
- `choice_label`: the text the visitor picked.
- `name`, `phone`, `message`, `lang` (`fr | en`).
- `status`: enum `new | confirmed | declined`, with `status_changed_at`.
- `party_size` (integer, default 1; events only): how many people the booking is for. The site's form asks "How many people?" on event bookings. *(My call, from the review.)*
- `source`: enum `website | whatsapp | phone | in_person`. Website requests come from the form. The others are reservations she adds by hand on an event, so bookings made outside the site count toward its places too. Only website requests get a `WEB-` ref. *(My call, from the review.)*
- `paid_at` (nullable; events only).
- `arrived_when_full` (boolean; the event was already full when the request came in).
- `client_id` (nullable): matched on the phone number when the request arrives, or set when she adds the person as a client.
- `erased_at` (nullable): when someone asks for their data to be deleted, "Erase personal details" blanks the name, phone and message and keeps the row, so counts and history still add up. *(My call, from the review.)*
- `created_at`.
- Bookings are never deleted from the dashboard; personal details can be erased (above).

**Phone notifications.** A new table, `push_subscriptions`:

- `user_id`.
- `endpoint` (unique), `p256dh` and `auth`.
- `created_at` and `last_ok_at`.

### 2. The public API (dashboard)

The routes live under `app/api/public/v1/`. Add `path.startsWith("/api/public/")` to `isPublicRoute` in `proxy.ts`. These are route handlers, so `requireUser()` doesn't apply. AGENTS.md gets a short section explaining that this is the only public surface and what protects it.

- **CORS.** Only the site's origins are allowed, listed in an env var (`SITE_ORIGINS`: `https://jnaninyoga.com`, `https://www.jnaninyoga.com`, `https://jnaninyoga.pages.dev`, plus `http://localhost:3000` in development).
- **`GET /api/public/v1/site`.** Everything the site builds from:
  - `classTimes: { days, times }`.
  - `cards`: `{ key, name, credits, months, price, popular }`, only memberships that are `on_site`, not archived and have a `site_key`, in `site_position` order.
  - `events`: the published events and the cancelled ones that were published, with `{ slug, title: { fr, en }, description: { fr, en }, startsAt, endsAt, place, mapsUrl, price, capacity, photoUrl, status }`. An empty English field is sent as `null`.
  - `generatedAt`.
  - No drafts, nothing archived, no personal data.
  - Cached briefly at Vercel's edge (`s-maxage=60`).
- **`GET /api/public/v1/events/places?slugs=a,b`.** `{ [slug]: { capacity, confirmed, left, full } }` for published events. `left` and `full` are null for unlimited events. Cached `s-maxage=30`.
- **`POST /api/public/v1/requests`.** The booking form.
  - It carries over every check in the site's `functions/api/contact.ts`: the Origin allowlist, the honeypot, fill-time limits, the name and phone rules and the length limits, and Turnstile with action `booking` and the hostname in the allowlist. A filled honeypot or an impossible fill time answers `{ ok: true }` and saves nothing.
  - It adds a rate limit per IP: a hash of the IP, not the IP itself, counted in the database. A few requests in 10 minutes is the builder's call.
  - With no Turnstile secret configured, it answers `503 not_configured`, and the site offers WhatsApp, as it does today.
  - For an event request, it checks the event is published and hasn't started.
  - It saves the row, answers `{ ok: true, ref }`, and then sends the notifications after the response (Next's `after()`; check `node_modules/next/dist/docs/` first).

### 3. Notifications (dashboard)

Each channel runs on its own. A failure goes through `logServerError` and never affects the saved request.

- **Phone.** Web Push through the installed dashboard app. Store VAPID keys in env and add the `web-push` package.
  - A "Notifications on this phone" switch, in Settings and on the Bookings page when it's off, asks the browser for permission and saves the subscription.
  - On an iPhone this only works when the dashboard is installed on the home screen (iOS 16.4 or later), so the switch says so when it can't work.
  - `app/sw.ts` gets `push` and `notificationclick` handlers. The notification shows the name and what they want, and tapping it opens that request.
  - A subscription that answers 404 or 410 is deleted.
- **Email** to `contact@jnaninyoga.com`. My call is to send through her own mailbox's SMTP (Mailhostbox, from `contact@` to `contact@`), with `nodemailer` and credentials in Vercel env. It needs no new service and no DNS change, and Mailhostbox is already in the domain's SPF. If Vercel can't reach it, the fallback is Resend's free tier, which needs DNS records on the domain.
  - The email is in French, like today's template in `contact.ts`: name, phone, what they want, the message, a WhatsApp button, a link to the request in the dashboard, and the ref.
- **The count** is the number of `new` requests. It shows on the Bookings item in the sidebar, as a badge on "Today" in the phone's bottom bar, and as a "New bookings" block at the top of the home page while any are waiting.

### 4. Dashboard screens

These follow AGENTS.md: `FormSheet`, `DataTable`/`EntityCard`, `EmptyState`, sections on the page background, the ⋮ menu top-right, errors with a ref, no `alert`/`confirm`, and mobile first.

**Navigation.** Bookings goes into the **Today** section, after Check-in. A new **Website** section holds Class times and Events. Cards stay under Price list → Memberships. The bottom bar doesn't change, apart from the badge on Today.

**Bookings** (`/bookings`, and `/bookings/[id]`; named by the owner on 2026-11-16, it was "Requests" in earlier drafts):

- New requests come first, newest first. Each card shows the name, what they want, when it arrived, the start of the message, and the client's name and current card when the phone matched.
- Actions: **WhatsApp** opens a reply already written in the visitor's language (`fr` or `en`), plus **Call**, **Confirm**, **Decline**, and **Add as client**, which opens the existing add-client form with the name and phone filled in.
- She can move a request back to New. Confirming an event request takes a place (see below).

**Memberships.** The membership sheet gets a "Shown on the website" group: on the site or not, popular, and a position. The key is set once, with a hint. A small "On the site" badge on the card shows which ones are live. Saving anything the site shows triggers a site rebuild, and the toast says "On the website in about 2 minutes".

**Class times** (`/website/class-times`):

- She picks the days, then edits one list of times (start and end) that applies to every chosen day.
- She sees a preview of the sentence the site will show ("Mondays and Thursdays, six sessions.").
- Saving validates against studio hours and triggers a rebuild. A time outside them is refused, with a link to Studio hours.
- **Switch-over (my call, from the review).** With no saved hours, the dashboard falls back to `DEFAULT_HOURS` (`lib/config/schedule.ts`): Monday to Friday until 20:00. Production was rebuilt empty on 2026-11-09, so that fallback would refuse today's 19:30–21:00 class. Slice 2 therefore starts by setting her real studio hours (at least Monday and Thursday from 08:30 to 21:00), then entering today's timetable unchanged.

**Events** (`/website/events`, `/website/events/[id]`):

- The list shows upcoming events first, then drafts, then past and cancelled ones.
- The event form has French and English titles and descriptions; start and end; place and an optional Maps link; price; a **Limited places** switch that reveals the number; and a photo. The photo is resized to a web size on upload and kept in public object storage (Vercel Blob or Supabase Storage, the builder's choice).
- **When an English field is empty,** an amber notice under it says English visitors will see the French text. It links to `https://translate.google.com/?sl=fr&tl=en&op=translate&text=<the French text>`. Publishing is still allowed.
- Buttons: **Publish**, **Save draft**, and on a published event **Cancel event** (with a reason).
- The event page shows the reservation list: name, phone, how many people, where it came from (website, WhatsApp, phone, in person), status (New, Confirmed, Declined) and a **Paid** tick, with a WhatsApp button on each. Above it, "8 of 12 places confirmed, 5 paid", or "8 confirmed, 5 paid" when there's no limit. Places count people: the sum of `party_size` over confirmed reservations.
- **Add reservation** opens a short form: an existing client, or a name and phone, plus how many people and the source. It's saved as confirmed, under the same lock and limit as confirming.
- **Confirming** locks the event row in a transaction (`SELECT … FOR UPDATE`). It's refused with the reason when it would go over the limit ("Full: 12 of 12 places confirmed. Raise the limit to add someone.").
- The Schedule's guest list for outdoor sessions (`components/schedule/events/guest-stack.tsx`, from Google Calendar attendees) stays as it is. For a published event, the event's reservation list is the record of who's coming.
- **The limit** can be changed after publishing, but never below the confirmed count.
- **Cancelling** a published event keeps its list, so she can message everyone. The site shows the event as cancelled.

**Publishing an event (my call).** Publishing also creates the outdoor session in her Google Calendar, with type `outdoor` and the price, and records it in `studio_sessions` like any session the dashboard creates. That way the event shows in her Schedule and on the home week, and blocks the time.

- This needs its own code path: `scheduleNewEventAction` takes a single day and refuses any overlap ("Slot is already booked"). For an event, an overlap is a warning she can publish past, not a refusal.
- If Google refuses (for example, she needs to sign in again), the event still publishes, and the event page shows "Not in your calendar yet" with a retry.
- Cancelling the event cancels the session through the existing cancel flow.
- Editing the date or time updates the calendar event. That needs a new update function in `services/google/calendar.service.ts`.

**Rebuilding the site.** A small helper, `lib/website/rebuild.ts`, calls Cloudflare's deploy hook (`SITE_DEPLOY_HOOK_URL`, a secret). It runs after a save changes what `GET /site` returns: class times, a card's site fields or price or archiving, or an event's publish, edit or cancel. Confirming a reservation doesn't trigger it, because places are read live. A daily Vercel cron (`CRON_SECRET`) also triggers a rebuild, so the HTML drops events that have ended. If the hook fails, she's told the change is saved but the website didn't update, with a retry.

### 5. The website

**Reading the data at build time.**

- One module (for example `src/content/live.ts`) fetches `SITE_API_URL` once per build.
- If the fetch fails, the build fails, and Cloudflare keeps the last good deploy live.
- For local work with no dashboard, it reads a committed snapshot, `src/content/snapshot.json`. A script refreshes the snapshot from the API.
- `site.ts` keeps contact details, formatting and `TIME_ZONE`. `plans`, `slots` and `slotDays` now come from the data.

**Every place that states these facts is derived from the data, in both languages.** The ones known today:

- the day arc and its headline ("Lundi et jeudi, six rendez-vous." / "Mondays and Thursdays, six sessions.");
- the FAQ answer in `fr.ts` line 51 and its English twin;
- `slotPrefix` ("Créneau de {time}, lundi ou jeudi");
- the carnets section;
- the booking form's options;
- the JSON-LD offers in `RootShell.tsx`;
- `public/llms.txt`, which needs to be generated at build.

The builder greps the copy for every other mention of days, times, prices and session counts. The headline and sentences are put together from the days, the number of times and number words in each language. Odd cases need sensible wording: one day, one time, no times. A card's bullet lines stay in the site copy under its `key`, and a card with no lines shows without them.

**The marquee.**

- A sticky band on every page of both languages, shown while at least one published event hasn't started yet.
- It loops through the upcoming events (at most three): title in the page's language, date and time, and "Book" or "Full". It links to the event's page.
- It pauses on hover and focus, stops moving under reduced motion or the site's own pause (`src/lib/pause.ts`), and is readable by screen readers as a plain list.
- Each event is hidden in the browser once it has started, so a stale build never advertises the past.
- Its look follows `DESIGN.md`: rose is "what is live", petrol ink, no new colours. It must not cover the header's controls.

**Events pages.** Add `events: { fr: "/evenements/", en: "/en/events/" }` to `routes.ts`, plus one page per event, `/evenements/<slug>/` and `/en/events/<slug>/`, from `generateStaticParams`.

- **The Events page** lists upcoming events in full: photo, date, time, place, price, places left, and a Book button. Past events follow, more compactly.
- **An event page** carries its own title, description and social card (the photo), plus `schema.org/Event` JSON-LD with offers, location and `eventStatus`. It's in the sitemap.
- **Places left** are fetched live from `/events/places`. While loading, and if that call fails, it shows the price with no count. When full, the Book button becomes "Ask about a cancellation" on WhatsApp.
- **A cancelled event** keeps its page, marked cancelled, with no Book button.
- **Language.** The English pages use the English text, falling back to the French when it's empty.

**The booking form.**

- It posts to `NEXT_PUBLIC_BOOKING_API_URL` (the dashboard's `POST /requests`).
- Its choices now include upcoming events. `?evenement=<slug>` preselects one, and full events are listed as full and can't be picked.
- The WhatsApp fallback stays, and the success message shows the ref.
- `functions/api/contact.ts`, the Cloudflare email variables and `docs/cloudflare-setup.md`'s email steps are removed. The Turnstile site key stays on the site, and its secret moves to the dashboard's Vercel env.

**Privacy.** The privacy page (`/confidentialite/`, `/en/privacy/`) says requests are now kept in the studio's own system and used only to reply and organise the session. Anyone can ask for their details to be erased, and the dashboard's "Erase personal details" does it. How long requests are kept otherwise is for the owner to set.

**Content-Security-Policy.** `public/_headers` allows `connect-src` and `img-src` only from `'self'` today. They must also allow the dashboard's API origin and the photo storage origin.

### 6. Delivery order

Each slice is one PR per repo. The dashboard PR is merged and its migration applied to production by the owner before the site PR deploys.

1. **Bookings.** `booking_requests` and `push_subscriptions`, `POST /requests`, the three notifications, the Bookings screens, and the site's form posting to the dashboard. This has the most value first, because the form sends nothing today.
2. **Class times and cards.** The `products` columns and `class_times`, `GET /site`, the rebuild helper and daily cron, and the site reading its data at build time with every derived sentence.
3. **Outdoor events.** `events`, photo storage, the Events screens and reservation list, the calendar link, `/events/places`, the Events pages, the marquee, and events in the booking form.

### 7. Verifying it

- **Unit tests** (Vitest, in `lib/domain/`):
  - the place rules: confirm, the limit, lowering the limit, cancelling;
  - class times against studio hours;
  - the public payload, which never contains drafts or archived cards;
  - request validation and phone matching;
  - on the site, the headline and sentences for 1–7 days and 0–8 times in both languages.
- **The local database harness** (AGENTS.md): two confirmations racing for the last place with a warmed pool; only one wins.
- **The browser:**
  - the dashboard screens on `/dev/playground` at phone and desktop widths;
  - the site at 390px and desktop, with the marquee, Events pages and form against a local dashboard;
  - no sideways scroll;
  - reduced motion.
- **End to end:** the owner sends a real booking from the deployed site, and the phone notification, the email and the count all arrive.
- **CI** in each repo (dashboard: `pnpm lint`, `typecheck`, `test`, `db:check`, `build`; site: `npm run lint`, `typecheck`, `build`).

## What the owner needs to provide

- **The Cloudflare Pages deploy hook URL.** The Pages project must build from Git for deploy hooks to exist.
- **The Turnstile site key and secret.** Turnstile is free and doesn't need the domain on Cloudflare.
- **The SMTP password for `contact@`,** or the go-ahead for Resend plus DNS records.
- **Applying each slice's migration to production** before its code ships.
- **Her five cards in production,** with the names and prices the site shows today, so the switch-over doesn't change the site.
- **Ouarda installs the dashboard on her phone's home screen** and turns notifications on.

## Left to the builder

- Exact API field names, beyond the shapes above.
- The rate limit numbers.
- Photo storage (Vercel Blob or Supabase Storage).
- The snapshot refresh script.
- How many past events the Events page shows.
- The marquee's exact look and speed, within `DESIGN.md`.
- The WhatsApp reply templates' wording.
- Whether "Paid" also records the method (cash or transfer).
