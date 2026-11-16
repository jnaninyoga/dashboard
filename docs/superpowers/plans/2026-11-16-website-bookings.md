# Website bookings (slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every booking sent from jnaninyoga.com lands in the dashboard as a request. Ouarda hears about it on her phone, by email and through a count, and handles it from a Requests screen.

**Architecture:** A new public route handler (`POST /api/public/v1/requests`) validates the site's form, saves a `booking_requests` row first, and then sends the notifications with `after()`. The rules are pure functions in `lib/domain/requests/`. The screens follow the dashboard's existing patterns (`DataTable` + `EntityCard`, sections on the page background, ⋮ menu). Tasks 1–10 change the dashboard. Task 11 is a separate PR in the website repo.

**Tech Stack:** Next.js 16 (App Router, route handlers, `after` from `next/server`), Drizzle + postgres.js, Zod 4, Vitest, `web-push`, `nodemailer`, Serwist service worker.

**Spec:** [docs/specs/website-from-the-command-center.md](../../specs/website-from-the-command-center.md), sections 1–4 and 6 (slice 1).

## Global Constraints

- Work on branch `feat/website-bookings` from `main`. Indent with tabs and format with `npx eslint --fix <files>`. Never run prettier.
- Every `"use server"` export starts with `await requireUser()`. Helpers the public route uses must live in plain modules (no `"use server"`), or they become public endpoints.
- Unexpected failures: `logServerError(scope, error)` and return `{ error, ref }`. On the client, show them with `notifyActionError`. Never `alert`/`confirm`; use `useConfirm()`.
- Conditional JSX uses ternaries, not `&&`.
- Times shown to her go through `lib/utils/time.ts` (studio time `Africa/Casablanca`). Never hard-code an offset.
- Migrations: `pnpm db:generate`, then apply to the local container only: `DATABASE_URL=postgres://postgres:dev@localhost:54329/jnanin pnpm db:migrate`. Never migrate `.env` (production). Applying to production is the owner's step, before deploy.
- Public origins come from env `WEBSITE_ORIGINS` (comma-separated). It's called `SITE_ORIGINS` in the spec, renamed because `NEXT_PUBLIC_SITE_URL` already means the dashboard's own URL here.
- Spec values copied verbatim: honeypot field `website`; fill time between 2 500 ms and 7 days; name at least 2 characters; phone at least 8 digits; clip name 120, phone 40, choice 160, message 2 000, lang 5; Turnstile action `booking`; ref `WEB-` + 8 uppercase hex; email to `contact@jnaninyoga.com`.
- Run heavy tools one at a time (dev server, `tsc`, full lint and browser each run alone). Stop the dev server before `pnpm build`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **The same booking sent twice** (a double tap, or a retry after a lost response) should give one request. The second submit within 10 minutes, with the same phone and choice, returns the first one's ref without notifying again. → Task 2 `findDuplicate` tests, used in Task 4.
2. **Phones written any way** ("06 61 28 64 64", "+212 (0)6 61…", "00212…") should match the same client. → Task 2 `phoneKey` tests.
3. **Markup in the name or message** must arrive as text, not markup, in the email and on screen. → Task 5 email escaping test; React escapes on screen.
4. **Notifications not configured** (no SMTP, no VAPID keys, no subscribed phone) must still save the request, answer 200, and log without throwing. → Task 5 `notifyNewRequest` test.
5. **An erased request** offers no WhatsApp, Call or "Add as client", and never matches a client. → Task 2 `contactOf` tests, used in Tasks 7 and 8.

---

### Task 1: Tables for requests and phone subscriptions

**Files:**

- Modify: `services/database/schema.ts` (enums near the others; tables after `studioSessions`; relations)
- Create: `services/database/migrations/0003_booking_requests.sql` (generated)

**Interfaces:**

- Produces:
  - Enums: `bookingRequestKindEnum` (`"booking_request_kind"`: `card`, `class`, `other`); `bookingRequestStatusEnum` (`"booking_request_status"`: `new`, `confirmed`, `declined`); `siteLangEnum` (`"site_lang"`: `fr`, `en`).
  - `bookingRequests` (`"booking_requests"`):
    - `id` uuid pk; `ref` text unique, nullable (manual reservations in slice 3 have none); `kind` not null;
    - `choiceKey` text null (e.g. `start-to-align`, `8h30`); `choiceLabel` text not null;
    - `name` text not null; `phone` text not null; `message` text null; `lang` not null default `fr`;
    - `status` not null default `new`; `statusChangedAt` timestamp null;
    - `clientId` uuid → `clients.id` `onDelete: "set null"`; `ipHash` text null; `erasedAt` timestamp null; `createdAt` not null default now.
    - Indexes `booking_requests_status_created_idx` (status, created_at) and `booking_requests_ip_created_idx` (ip_hash, created_at).
  - `pushSubscriptions` (`"push_subscriptions"`): `id` uuid pk; `userId` text not null → `users.id` `onDelete: "cascade"`; `endpoint` text not null unique; `p256dh` text not null; `auth` text not null; `createdAt` not null default now; `lastOkAt` timestamp null.
  - Types `BookingRequest`, `NewBookingRequest`, `PushSubscription`. Relations: `bookingRequests.client` → `clients`.
  - *Note: the spec's `product_id`, `class_time`, `party_size`, `source`, `paid_at`, `arrived_when_full` and `event_id` arrive with slices 2 and 3, which need them. Slice 1 records the visitor's choice as `choiceKey` + `choiceLabel`.*

- [ ] **Step 1: Branch.** Run: `git switch -c feat/website-bookings`. Expected: `Switched to a new branch 'feat/website-bookings'`.
- [ ] **Step 2: Add the enums, tables, types and relation** in `schema.ts` exactly as above, with a short comment above each table in the file's voice (what it is in her day).
- [ ] **Step 3: Generate.** Run: `pnpm db:generate --name booking_requests`. Expected: a new `0003_booking_requests.sql` with `CREATE TYPE` × 3, `CREATE TABLE` × 2 and the indexes, with no change to existing tables.
- [ ] **Step 4: Apply locally.** Run: `docker start jnanin-pg-dev; DATABASE_URL=postgres://postgres:dev@localhost:54329/jnanin pnpm db:migrate`. Expected: migration applied, no error.
- [ ] **Step 5: Drift check.** Run: `pnpm db:check`. Expected: exits 0 with no diff.
- [ ] **Step 6: Commit.** `git add services/database && git commit -m "feat(db): add booking requests and push subscriptions"`.

### Task 2: The rules for a website request (pure, tested)

**Files:**

- Create: `lib/domain/requests/submission.ts`, `lib/domain/requests/phone.ts`, `lib/domain/requests/reply.ts`
- Test: `lib/domain/requests/submission.test.ts`, `lib/domain/requests/phone.test.ts`, `lib/domain/requests/reply.test.ts`

**Interfaces:**

- Produces (`submission.ts`):
  - `type Submission = { name: string; phone: string; kind: "card" | "class" | "other"; choiceKey: string | null; choiceLabel: string; message: string | null; lang: "fr" | "en"; token: string }`
  - `type SubmissionResult = { outcome: "bot" } | { outcome: "invalid"; fields: Partial<Record<"name" | "phone", "too_short" | "invalid">> } | { outcome: "ok"; submission: Submission }`
  - `parseSubmission(body: unknown): SubmissionResult`. A non-object body counts as a bot. `choiceKey` input `"plan:<key>"` gives kind `card`; `"slot:<id>"` gives `class`; anything else gives `other` with `choiceKey` null. `choiceLabel` is the clipped `choice` or `"—"`. A `lang` other than `en` becomes `fr`. `token` is a string of at most 2 048 characters, else `""`.
  - `newRequestRef(): string`
  - `DUPLICATE_WINDOW_MINUTES = 10`, `RATE_LIMIT = { max: 5, windowMinutes: 10 }`
  - `findDuplicate<T extends { phone: string; choiceLabel: string; createdAt: Date }>(recent: T[], s: Pick<Submission, "phone" | "choiceLabel">, now: Date): T | null`. It returns the first entry with an equal `phoneKey`, an equal `choiceLabel`, and `createdAt` within `DUPLICATE_WINDOW_MINUTES` of `now`.
- Produces (`phone.ts`):
  - `phoneKey(phone: string): string | null`: digits only, without a leading `00`; a Moroccan national `0XXXXXXXXX` becomes `212XXXXXXXXX`; `2120` followed by 9 digits becomes `212` + 9 digits (the "(0)" habit); fewer than 8 digits gives null.
  - `toE164(phone: string): string | undefined`: `+` followed by `phoneKey`.
- Produces (`reply.ts`):
  - `type RequestContact = { name: string; phone: string }`
  - `contactOf(r: { name: string; phone: string; erasedAt: Date | null }): RequestContact | null`
  - `whatsappReply(r: { name: string; lang: "fr" | "en"; kind: "card" | "class" | "other"; choiceLabel: string }): string`

- [ ] **Step 1: Write the failing tests.**

```ts
// submission.test.ts
const good = { name: "Salma B.", phone: "06 61 28 64 64", choice: "Start To Align (1 500 Dh)", choiceKey: "plan:start-to-align", message: "  first time  ", lang: "en", website: "", filledMs: 9000, token: "t" };
it("reads a good booking", () => expect(parseSubmission(good)).toEqual({ outcome: "ok", submission: { name: "Salma B.", phone: "06 61 28 64 64", kind: "card", choiceKey: "start-to-align", choiceLabel: "Start To Align (1 500 Dh)", message: "first time", lang: "en", token: "t" } }));
it("reads a slot as a class", () => expect(parseSubmission({ ...good, choiceKey: "slot:8h30" })).toMatchObject({ submission: { kind: "class", choiceKey: "8h30" } }));
it("reads no choice as other", () => expect(parseSubmission({ ...good, choiceKey: "" })).toMatchObject({ submission: { kind: "other", choiceKey: null } }));
it("treats a filled honeypot as a bot", () => expect(parseSubmission({ ...good, website: "x" })).toEqual({ outcome: "bot" }));
it.each([undefined, 100, 2499, 7 * 24 * 3600 * 1000 + 1])("treats fill time %s as a bot", (filledMs) => expect(parseSubmission({ ...good, filledMs })).toEqual({ outcome: "bot" }));
it("refuses a short name and a short phone", () => expect(parseSubmission({ ...good, name: " S ", phone: "12 34" })).toEqual({ outcome: "invalid", fields: { name: "too_short", phone: "invalid" } }));
it("clips long fields", () => expect((parseSubmission({ ...good, message: "a".repeat(3000) }) as any).submission.message).toHaveLength(2000));
it("falls back to French", () => expect(parseSubmission({ ...good, lang: "de" })).toMatchObject({ submission: { lang: "fr" } }));
it("makes refs like WEB-1A2B3C4D", () => expect(newRequestRef()).toMatch(/^WEB-[0-9A-F]{8}$/));
it("finds the same booking sent again within 10 minutes", () => {
	const now = new Date("2026-06-10T10:00:00Z");
	const first = { phone: "+212661286464", choiceLabel: "Start To Align (1 500 Dh)", createdAt: new Date("2026-06-10T09:55:00Z") };
	expect(findDuplicate([first], { phone: "06 61 28 64 64", choiceLabel: first.choiceLabel }, now)).toBe(first);
	expect(findDuplicate([{ ...first, createdAt: new Date("2026-06-10T09:49:00Z") }], { phone: "0661286464", choiceLabel: first.choiceLabel }, now)).toBeNull();
	expect(findDuplicate([first], { phone: "0661286464", choiceLabel: "Graceful Reset (2 600 Dh)" }, now)).toBeNull();
});

// phone.test.ts
it.each([["+212 661 286 464", "212661286464"], ["0661286464", "212661286464"], ["00212661286464", "212661286464"], ["+212 (0)6 61 28 64 64", "212661286464"], ["+33 6 12 34 56 78", "33612345678"]])("keys %s", (input, key) => expect(phoneKey(input)).toBe(key));
it("has no key for too few digits", () => expect(phoneKey("12 34")).toBeNull());
it("writes E.164 for the phone field", () => expect(toE164("06 61 28 64 64")).toBe("+212661286464"));

// reply.test.ts
it("greets by first name in French with the choice", () => expect(whatsappReply({ name: "Salma Bennani", lang: "fr", kind: "card", choiceLabel: "Start To Align (1 500 Dh)" })).toBe("Bonjour Salma, c'est Ouarda de jnaninyoga. Merci pour votre demande (Start To Align (1 500 Dh))."));
it("greets in English and leaves out an open choice", () => expect(whatsappReply({ name: "Tom", lang: "en", kind: "other", choiceLabel: "I'm not sure yet" })).toBe("Hello Tom, this is Ouarda from jnaninyoga. Thank you for your request."));
it("has no contact once erased", () => expect(contactOf({ name: "", phone: "", erasedAt: new Date() })).toBeNull());
it("gives the contact otherwise", () => expect(contactOf({ name: "Salma", phone: "0661286464", erasedAt: null })).toEqual({ name: "Salma", phone: "0661286464" }));
```

- [ ] **Step 2: Run them and check they fail.** Run: `pnpm vitest run lib/domain/requests`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** the three modules with the signatures above. The French reply without a choice reads `"Bonjour Salma, c'est Ouarda de jnaninyoga. Merci pour votre demande."` `newRequestRef` uses `crypto.randomUUID()` (the same as today's site function).
- [ ] **Step 4: Run them and check they pass.** Run: `pnpm vitest run lib/domain/requests`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add lib/domain/requests && git commit -m "feat(requests): rules for a website booking"`.

### Task 3: Website origins, Turnstile and IP hashing

**Files:**

- Create: `lib/website/origins.ts`, `lib/website/turnstile.ts`, `lib/website/ip.ts`
- Test: `lib/website/origins.test.ts`, `lib/website/turnstile.test.ts`

**Interfaces:**

- Produces:
  - `websiteOrigins(env?: NodeJS.ProcessEnv): string[]`: the trimmed, non-empty entries of `WEBSITE_ORIGINS`.
  - `corsHeaders(origin: string | null, allowed?: string[]): Record<string, string> | null`. For an allowed origin: `Access-Control-Allow-Origin: <origin>`, `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: content-type`, `Access-Control-Max-Age: 86400`, `Vary: Origin`. Otherwise null.
  - `verifyTurnstile(token: string, opts: { secret: string; remoteIp: string | null; hostnames: string[]; production: boolean }, fetchImpl?: typeof fetch): Promise<boolean>`. It posts to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with a 10 s timeout. It's true only when `success === true && action === "booking" && hostnames.includes(hostname)`. The one exception: when `!production` and the secret is Cloudflare's always-pass test secret `1x0000000000000000000000000000000AA`, `success === true` is enough, so local testing works. A network error gives false and is logged.
  - `hashIp(ip: string, secret: string): string`: HMAC-SHA256 hex of `"booking-ip:" + ip`, keyed by `secret` (the route passes `BETTER_AUTH_SECRET`).
  - `clientIp(headers: Headers): string | null`: the first entry of `x-forwarded-for`, else `x-real-ip`. The route hashes `clientIp(headers) ?? "unknown"`, so requests without an IP (local curl) share one bucket and are still rate-limited.

- [ ] **Step 1: Write the failing tests.**

```ts
it("lists the origins", () => expect(websiteOrigins({ WEBSITE_ORIGINS: " https://jnaninyoga.com, https://jnaninyoga.pages.dev ,," } as any)).toEqual(["https://jnaninyoga.com", "https://jnaninyoga.pages.dev"]));
it("answers CORS only for the site", () => {
	expect(corsHeaders("https://jnaninyoga.com", ["https://jnaninyoga.com"])?.["Access-Control-Allow-Origin"]).toBe("https://jnaninyoga.com");
	expect(corsHeaders("https://evil.example", ["https://jnaninyoga.com"])).toBeNull();
	expect(corsHeaders(null, ["https://jnaninyoga.com"])).toBeNull();
});
const reply = (body: object) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;
const opts = { secret: "s", remoteIp: null, hostnames: ["jnaninyoga.com"], production: true };
it("passes a real check", async () => expect(await verifyTurnstile("t", opts, reply({ success: true, action: "booking", hostname: "jnaninyoga.com" }))).toBe(true));
it("refuses another action or host", async () => {
	expect(await verifyTurnstile("t", opts, reply({ success: true, action: "login", hostname: "jnaninyoga.com" }))).toBe(false);
	expect(await verifyTurnstile("t", opts, reply({ success: true, action: "booking", hostname: "evil.example" }))).toBe(false);
});
it("refuses when Cloudflare can't be reached", async () => expect(await verifyTurnstile("t", opts, (async () => { throw new Error("down"); }) as unknown as typeof fetch)).toBe(false));
it("lets the test secret through outside production only", async () => {
	const test = { ...opts, secret: "1x0000000000000000000000000000000AA" };
	expect(await verifyTurnstile("t", { ...test, production: false }, reply({ success: true }))).toBe(true);
	expect(await verifyTurnstile("t", test, reply({ success: true }))).toBe(false);
});
```

- [ ] **Step 2: Run them and check they fail.** Run: `pnpm vitest run lib/website`. Expected: FAIL.
- [ ] **Step 3: Implement** the three modules. Port the Turnstile request from the website's `functions/api/contact.ts`, `passedTurnstile`.
- [ ] **Step 4: Run them and check they pass.** Run: `pnpm vitest run lib/website`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add lib/website && git commit -m "feat(website): origins, Turnstile check and IP hashing"`.

### Task 4: The public booking endpoint

**Files:**

- Create: `app/api/public/v1/requests/route.ts`, `lib/requests/store.ts` (plain server module, no `"use server"`)
- Modify: `proxy.ts` (`isPublicRoute`)

**Interfaces:**

- Consumes: `parseSubmission`, `newRequestRef`, `findDuplicate`, `RATE_LIMIT`, `DUPLICATE_WINDOW_MINUTES`, `phoneKey` (Task 2); `corsHeaders`, `websiteOrigins`, `verifyTurnstile`, `hashIp`, `clientIp` (Task 3); `notifyNewRequest` (Task 5; until Task 5 lands, the route imports it from `lib/notifications/index.ts` as a stub that resolves).
- Produces (`lib/requests/store.ts`):
  - `countRecentFromIp(ipHash: string, since: Date): Promise<number>`
  - `recentRequests(since: Date): Promise<Pick<BookingRequest, "id" | "ref" | "phone" | "choiceLabel" | "createdAt">[]>`
  - `matchClientId(phone: string): Promise<string | null>`: loads `clients.id, clients.phone` and compares `phoneKey`.
  - `saveRequest(row: NewBookingRequest): Promise<BookingRequest>`
- Produces (HTTP):
  - `OPTIONS`: 204 with CORS headers for an allowed origin, 403 otherwise.
  - `POST`, in this order:
    1. Origin not allowed: 403 `{error:"forbidden"}`.
    2. Bad JSON: 400 `{error:"invalid_json"}`.
    3. Bot: 200 `{ok:true}`, nothing saved.
    4. Invalid: 422 `{error:"invalid", fields}`.
    5. No `TURNSTILE_SECRET`: 503 `{error:"not_configured"}`.
    6. Rate limit reached (≥ `RATE_LIMIT.max` saved from this IP hash in the window): 429 `{error:"too_many"}`.
    7. Turnstile fails: 403 `{error:"not_verified"}`.
    8. Duplicate: 200 `{ok:true, ref:<first ref>}`, no new notification.
    9. Save fails: 500 `{error:"save_failed", ref:<logServerError code>}`.
    10. Success: 200 `{ok:true, ref}`, then `after(() => notifyNewRequest(saved))`.
  - Every answer to an allowed origin carries the CORS headers. Turnstile hostnames are the hostnames of `websiteOrigins()`.

- [ ] **Step 1: Make the route public.** Add `path.startsWith("/api/public/")` to `isPublicRoute` in `proxy.ts`, with a one-line comment naming who calls it.
- [ ] **Step 2: Implement `lib/requests/store.ts`** with the four functions, starting with `import "server-only";`.
- [ ] **Step 3: Implement the route** in the order above. Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` and `.../04-functions/after.md` first.
- [ ] **Step 4: Typecheck.** Run: `NODE_OPTIONS=--max-old-space-size=2500 pnpm typecheck`. Expected: no errors.
- [ ] **Step 5: Exercise it against the local database.** In `.env.local`, set `WEBSITE_ORIGINS=http://localhost:3100` and `TURNSTILE_SECRET=1x0000000000000000000000000000000AA`, then start `pnpm dev`. Run these with `curl -s -i -X POST localhost:3000/api/public/v1/requests -H 'content-type: application/json'`:

| Request | Expected |
| --- | --- |
| `-H 'origin: http://localhost:3100'`, good body (Task 2's `good`, phone `0661286464`) | `200 {"ok":true,"ref":"WEB-…"}`, one row in `booking_requests` |
| the same again | 200 with the **same** ref, still one row |
| `website:"x"` | `200 {"ok":true}`, no row |
| `name:"S"` | `422` with `fields.name` |
| origin `https://evil.example` | `403` |
| `-X OPTIONS` with the allowed origin | `204` with `Access-Control-Allow-Origin` |
| 6 different phones in a row | the 6th is `429` |

Check rows with `docker exec jnanin-pg-dev psql -U postgres -d jnanin -c "select ref, kind, choice_key, client_id from booking_requests"`. Then delete the test rows from the **local** container.

- [ ] **Step 6: Stop the dev server, lint and commit.** `npx eslint --fix proxy.ts lib/requests app/api/public && git add -A proxy.ts lib/requests app/api/public && git commit -m "feat(requests): public endpoint for website bookings"`.

### Task 5: Email and phone notifications

**Files:**

- Create: `lib/domain/requests/notice.ts`, `lib/notifications/email.ts`, `lib/notifications/push.ts`, `lib/notifications/index.ts`
- Test: `lib/domain/requests/notice.test.ts`, `lib/notifications/index.test.ts`
- Modify: `package.json` (add `web-push`, `nodemailer`; dev: `@types/web-push`, `@types/nodemailer`)

**Interfaces:**

- Consumes: `BookingRequest` (Task 1), `getSiteUrl()` (`lib/utils/site-url.ts`, the dashboard's own URL).
- Produces:
  - `requestEmail(r: Pick<BookingRequest, "id" | "ref" | "name" | "phone" | "choiceLabel" | "message" | "lang">, dashboardUrl: string): { subject: string; text: string; html: string }`. The subject is `Website: Réservation de ${name}`, the same as today. The French body has Téléphone, Demande, Langue, the message, a "Répondre sur WhatsApp" button (`https://wa.me/${phoneKey(phone) ?? digits}`, since a national "06…" number needs its country code for WhatsApp), an "Ouvrir dans le tableau de bord" link (`${dashboardUrl}/requests/${id}`) and the ref. Every value is HTML-escaped.
  - `requestPushPayload(r: Pick<BookingRequest, "id" | "name" | "choiceLabel" | "message">): { title: string; body: string; url: string; tag: string }`. The title is the name. The body is the choice, then ` · ` and the message's first 80 characters (with `…`) when there's a message. The url is `/requests/${id}` and the tag is the id.
  - `sendRequestEmail(r: BookingRequest): Promise<void>`. It uses `SMTP_HOST`, `SMTP_PORT` (465 means `secure: true`), `SMTP_USER`, `SMTP_PASS` and `REQUESTS_EMAIL_TO` (default `contact@jnaninyoga.com`). From is `"Site jnaninyoga" <SMTP_USER>`. Without config it throws `new Error("SMTP not configured")`.
  - `sendRequestPush(r: BookingRequest): Promise<void>`. It uses `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (default `mailto:contact@jnaninyoga.com`), and sends to every `push_subscriptions` row. A 404 or 410 deletes that row; a success sets `lastOkAt`. With no subscriptions it does nothing. Without keys it throws `new Error("Push not configured")`.
  - `notifyNewRequest(r: BookingRequest, senders?: { email: typeof sendRequestEmail; push: typeof sendRequestPush }): Promise<void>`. It runs both senders with `Promise.allSettled` and logs each rejection with `logServerError("Request email" | "Request push", reason)`. It never throws.

- [ ] **Step 1: Write the failing tests.**

```ts
// notice.test.ts
const r = { id: "abc", ref: "WEB-1A2B3C4D", name: "<b>Salma</b>", phone: "06 61 28 64 64", choiceLabel: "Start To Align (1 500 Dh)", message: "first time & a bit stiff", lang: "fr" as const };
it("escapes what the visitor typed", () => {
	const { html, subject } = requestEmail(r, "https://dash.jnaninyoga.com");
	expect(html).toContain("&lt;b&gt;Salma&lt;/b&gt;");
	expect(html).not.toContain("<b>Salma</b>");
	expect(html).toContain("https://dash.jnaninyoga.com/requests/abc");
	expect(html).toContain("https://wa.me/212661286464");
	expect(subject).toBe("Website: Réservation de <b>Salma</b>");
});
it("makes a short phone notification", () => expect(requestPushPayload({ ...r, message: "x".repeat(100) })).toEqual({ title: "<b>Salma</b>", body: `Start To Align (1 500 Dh) · ${"x".repeat(80)}…`, url: "/requests/abc", tag: "abc" }));

// index.test.ts
it("never throws when a channel fails", async () => {
	const failing = async () => { throw new Error("SMTP not configured"); };
	await expect(notifyNewRequest({ id: "abc" } as any, { email: failing, push: failing })).resolves.toBeUndefined();
});
it("sends on both channels", async () => {
	const email = vi.fn(async () => {}), push = vi.fn(async () => {});
	await notifyNewRequest({ id: "abc" } as any, { email, push });
	expect(email).toHaveBeenCalledOnce(); expect(push).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run them and check they fail.** Run: `pnpm vitest run lib/domain/requests/notice.test.ts lib/notifications`. Expected: FAIL.
- [ ] **Step 3: Add the dependencies.** Run: `pnpm add web-push nodemailer && pnpm add -D @types/web-push @types/nodemailer`. Expected: installed.
- [ ] **Step 4: Implement** the four modules. `index.ts` replaces Task 4's stub.
- [ ] **Step 5: Run them and check they pass.** Run: `pnpm vitest run lib/domain/requests lib/notifications`. Expected: PASS.
- [ ] **Step 6: Send a real email.** Put the SMTP values in `.env.local` (if the owner has given the `contact@` password; otherwise note it as pending and skip). Post one booking as in Task 4, step 5. Expected: an email arrives at `contact@jnaninyoga.com`. If Mailhostbox refuses the connection from Vercel or locally, stop and tell the owner; the fallback is Resend (spec §3).
- [ ] **Step 7: Commit.** `git add package.json pnpm-lock.yaml lib/domain/requests lib/notifications && git commit -m "feat(requests): email and phone notifications for a new booking"`.

### Task 6: Turning notifications on for this phone

**Files:**

- Create: `lib/actions/requests/push.ts` (`"use server"`), `lib/utils/push.ts`, `components/requests/notifications-switch.tsx`, `app/(dashboard)/settings/notifications/page.tsx`
- Test: `lib/utils/push.test.ts`
- Modify: `app/sw.ts`, `lib/config/dashboard.ts` (settings item), `lib/config/dashboard.test.ts`

**Interfaces:**

- Produces:
  - `savePushSubscriptionAction(sub: unknown): Promise<{ success?: true; error?: string; ref?: string }>`. It checks the subscription with Zod `{ endpoint: z.url(), keys: { p256dh: z.string().min(1), auth: z.string().min(1) } }` and upserts on `endpoint` with `userId = user.id`.
  - `removePushSubscriptionAction(endpoint: string): Promise<{ success?: true; error?: string; ref?: string }>`
  - `urlBase64ToUint8Array(base64Url: string): Uint8Array`
  - `<NotificationsSwitch />` (client component) has four states:
    - **unsupported:** no `PushManager`, or an iPhone not opened from the home screen (`navigator.standalone !== true` on iOS). It says "Add the dashboard to your Home Screen (Share → Add to Home Screen), then open it from there to turn on notifications."
    - **blocked:** `Notification.permission === "denied"`. It says how to allow them in the browser's settings.
    - **off** and **on:** a `Switch` labelled "Notify me on this phone when a booking arrives". Turning it on asks permission, subscribes via `(await window.serwist).pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` and saves. Turning it off unsubscribes and removes it.
  - Settings item `{ title: "Notifications", url: "/settings/notifications", icon: Notification }`.
- Service worker (`app/sw.ts`): on `push`, show `showNotification(title, { body, tag, data: { url }, icon: "/icons/icon-192x192.png" })` (use the icon path `app/manifest.ts` already declares). On `notificationclick`, close the notification, focus an open dashboard window and navigate it to `data.url`, or else `clients.openWindow(data.url)`.

- [ ] **Step 1: Write the failing test.**

```ts
it("decodes a VAPID key", () => expect(Array.from(urlBase64ToUint8Array("AQID_-8"))).toEqual([1, 2, 3, 255, 239]));
```

Add to `dashboard.test.ts`: the settings list includes `"/settings/notifications"`.

- [ ] **Step 2: Run them and check they fail.** Run: `pnpm vitest run lib/utils/push.test.ts lib/config`. Expected: FAIL.
- [ ] **Step 3: Implement** the util, the actions, the switch, the settings page (a page header in the style of `settings/schedule/page.tsx`: title "Notifications", one sentence, then the switch), the settings item and the service-worker handlers.
- [ ] **Step 4: Run them and check they pass.** Run: `pnpm vitest run lib/utils lib/config`. Expected: PASS.
- [ ] **Step 5: Try it in a browser.** Generate keys with `npx web-push generate-vapid-keys` and put them in `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). Under `pnpm build && pnpm start` (the service worker is only reliable in a production build), sign in on desktop Chrome, turn the switch on, and post a booking (Task 4, step 5). Expected: a system notification with the name, and clicking it opens `/requests/<id>`. The owner's phone is checked after deploy (Task 10).
- [ ] **Step 6: Lint and commit.** `npx eslint --fix app/sw.ts lib/actions/requests lib/utils/push.ts components/requests "app/(dashboard)/settings/notifications" lib/config && git add app/sw.ts lib/actions/requests lib/utils/push.ts lib/utils/push.test.ts components/requests "app/(dashboard)/settings/notifications" lib/config && git commit -m "feat(requests): notifications on her phone"`.

### Task 7: Reading and changing requests (server actions)

**Files:**

- Create: `lib/actions/requests/queries.ts` (`"use server"`), `lib/actions/requests/mutations.ts` (`"use server"`)
- Test: covered by the domain tests, plus the harness check in step 3

**Interfaces:**

- Consumes: `bookingRequests`, `clients` (with `wallets` and `product`), `phoneKey`, `contactOf`, `creditsSummary` (`lib/domain/clients/card.ts`).
- Produces:
  - `type RequestView = BookingRequest & { client: { id: string; fullName: string; credits: ReturnType<typeof creditsSummary> } | null }`. The client is `clientId` when set; otherwise, for a request that isn't erased, a match on `phoneKey` at read time, so a client added later is found.
  - `getRequests(opts?: { status?: "new"; limit?: number }): Promise<{ data?: RequestView[]; error?: string; ref?: string }>`. New requests come first, then the rest; each group is newest first.
  - `getRequest(id: string): Promise<{ data?: RequestView | null; error?: string; ref?: string }>`
  - `getNewRequestCount(): Promise<number>`. It returns 0 on failure and logs.
  - `setRequestStatusAction(id: string, status: "new" | "confirmed" | "declined"): Promise<{ success?: true; error?: string; ref?: string }>`. It sets `statusChangedAt = now` and revalidates `/requests`, `/requests/${id}`, and `/` with `"layout"`.
  - `eraseRequestAction(id: string): Promise<{ success?: true; error?: string; ref?: string }>`. It sets `name = ""`, `phone = ""`, `message = null`, `ipHash = null`, `clientId = null` and `erasedAt = now`; it's idempotent and revalidates the same paths.

- [ ] **Step 1: Implement** both files. Each export starts with `await requireUser()`. Reads catch errors and return `{ error, ref }`.
- [ ] **Step 2: Typecheck.** Run: `NODE_OPTIONS=--max-old-space-size=2500 pnpm typecheck`. Expected: no errors.
- [ ] **Step 3: Check it against the local database** with the action harness (AGENTS.md "Database": a tsconfig mapping `@/*` and stubbing `next/cache`; `requireUser` also needs stubbing to return `{ id: "test" }`). Seed one client with phone `+212661286464` and one request with phone `06 61 28 64 64` and no `clientId`. Expected: `getRequest` returns that client; after `eraseRequestAction`, `getRequest` returns `client: null`, `name: ""` and `erasedAt` set; `getNewRequestCount()` falls from 1 to 0 after `setRequestStatusAction(id, "confirmed")`.
- [ ] **Step 4: Commit.** `git add lib/actions/requests && git commit -m "feat(requests): read, confirm, decline and erase requests"`.

### Task 8: The Requests screens

**Files:**

- Create:
  - `app/(dashboard)/requests/page.tsx`, `loading.tsx`, `error.tsx` (copy the shape of `clients/`)
  - `app/(dashboard)/requests/[id]/page.tsx`
  - `components/requests/request-card.tsx`, `components/requests/request-actions.tsx`, `components/requests/requests-list.tsx`
- Modify: `app/(dashboard)/clients/add/page.tsx` (prefill from a request)

**Interfaces:**

- Consumes: Task 7's actions and `RequestView`; `contactOf`, `whatsappReply`, `toE164` (Task 2); `whatsappHref` (`lib/utils/contact.ts`); `NotificationsSwitch` (Task 6); `DataTable`, `EntityCard*`, `EmptyState`, `useConfirm`, `notify`, `notifyActionError`.
- Produces:
  - **The `/requests` page.** The title is "Requests", with one sentence: "Bookings from jnaninyoga.com. Reply on WhatsApp, then confirm or decline." When this browser has no push subscription, `NotificationsSwitch` sits under the header. Two sections in the shared section layout (a heading on the page background, one framed container): **New** and **Handled**. Each is a `DataTable` (desktop columns: Name, What, Received, Status, actions) with `renderCard` → `RequestCard` on phones and `getRowHref` → `/requests/${id}`. `EmptyState` for New: "No new requests. Bookings from jnaninyoga.com land here."
  - **`RequestCard`.** The header holds the name (or "Details erased"), the choice, and the received time in studio time ("Today 9:41", "Mon 26 Oct"). A status badge sits next to the name. The figures are the matched client's name and credits ("6 of 10", "No card"), or "New to the studio". The actions are WhatsApp (`whatsappHref(toE164(phone) ?? phone)` + `?text=` + `encodeURIComponent(whatsappReply(r))`) and Confirm, or Back to new when it's handled. The ⋮ menu holds Call (`tel:` + `toE164(phone) ?? phone`), Decline, Add as client (only without a match) and Erase personal details (with `useConfirm`: "Erase Salma's details? Their name, phone and message are removed for good. The request stays in your counts."). With `contactOf(r) === null`, WhatsApp, Call and Add as client are hidden.
  - **The `/requests/[id]` page.** The same facts in full: the whole message, phone, language, ref, the status with when it changed, and the matched client linking to `/clients/${id}`. The same actions as buttons. `notFound()` for an unknown id.
  - **`/clients/add?fromRequest=<id>`.** It loads `getRequest(id)` and passes `initialData = { fullName: name, phone: toE164(phone), referralSource: "website" }` to `ClientForm`. If the request is missing or erased, it has no prefill.

- [ ] **Step 1: Implement** the components and pages, phone first: controls at least 44px, text at least 12px, no sideways scroll at 390px.
- [ ] **Step 2: Typecheck and lint the files.** Run: `NODE_OPTIONS=--max-old-space-size=2500 pnpm typecheck && npx eslint --fix "app/(dashboard)/requests" components/requests "app/(dashboard)/clients/add"`. Expected: clean.
- [ ] **Step 3: Check it in a browser.** Sign-in can't be automated, so render `RequestCard` and the list with three sample requests (new and matched, new and unknown, erased) on `app/dev/playground/`. Check at 390px and 1280px. Expected: the cards line up, the ⋮ menu is top-right, erased shows no contact actions, and nothing scrolls sideways. Rate the result against AGENTS.md's bar and iterate to 9/10.
- [ ] **Step 4: Commit.** `git add -A "app/(dashboard)/requests" components/requests "app/(dashboard)/clients/add" app/dev/playground && git commit -m "feat(requests): requests list and request page"`.

### Task 9: The count in navigation and on the home page

**Files:**

- Create: `components/requests/use-new-request-count.ts`, `components/dashboard/new-requests.tsx`, `lib/actions/requests/count.ts` (`"use server"`)
- Modify: `lib/config/dashboard.ts`, `lib/config/dashboard.test.ts`, `app/(dashboard)/layout.tsx`, `components/app-sidebar.tsx`, `components/bottom-bar.tsx`, `app/(dashboard)/page.tsx`

**Interfaces:**

- Consumes: `getNewRequestCount`, `getRequests({ status: "new", limit: 3 })` (Task 7).
- Produces:
  - Today section items: Dashboard, Check-in, then `{ title: "Requests", url: "/requests", icon: DirectInbox }`.
  - `getNewRequestCountAction(): Promise<number>` (`requireUser`, then `getNewRequestCount`).
  - `useNewRequestCount(initial: number): number`. It refetches through `getNewRequestCountAction` on `visibilitychange` (when visible) and on `focus`.
  - `AppSidebar` takes `newRequests: number` and shows `SidebarMenuBadge` on Requests when it's above 0. `BottomBar` takes `newRequests: number` and shows a rose count dot on Today when it's above 0, with `aria-label` "3 new requests".
  - `<NewRequests requests={RequestView[]} count={number} />` goes at the top of the home page, above the agenda, only while there are new requests. The title is "3 new requests". It lists up to 3 rows (name · choice · time) linking to each request, then "Open requests".
  - The layout fetches `getNewRequestCount()` alongside its existing work and passes it down.

- [ ] **Step 1: Write the failing test.** In `dashboard.test.ts`: the Today section's urls are `["/", "/check-in", "/requests"]`.
- [ ] **Step 2: Run it and check it fails.** Run: `pnpm vitest run lib/config`. Expected: FAIL.
- [ ] **Step 3: Implement** the item, the action, the hook, the sidebar and bottom-bar badges, the home block and the layout wiring.
- [ ] **Step 4: Run it and check it passes.** Run: `pnpm vitest run lib/config`. Expected: PASS.
- [ ] **Step 5: Check it in a browser** on the playground at 390px and 1280px. The badge doesn't shift the labels, the dot clears the icon, and the home block follows the section layout. Expected: 9/10 or better against AGENTS.md's bar.
- [ ] **Step 6: Lint and commit.** `npx eslint --fix lib/config lib/actions/requests/count.ts components/requests components/dashboard/new-requests.tsx components/app-sidebar.tsx components/bottom-bar.tsx "app/(dashboard)/layout.tsx" "app/(dashboard)/page.tsx" && git add` (the same paths) `&& git commit -m "feat(requests): new-request count in navigation and on the home page"`.

### Task 10: Documentation, the full check and the PR

**Files:**

- Modify: `AGENTS.md`, `.env.example` (create it if missing, with names only and no values)

- [ ] **Step 1: Update AGENTS.md.**
  - Add `app/api/public/` to "Where things live".
  - Add a **Public API** section. `app/api/public/v1/` is the only signed-out surface. It's guarded by the `WEBSITE_ORIGINS` allowlist, CORS, Turnstile, the honeypot and fill time, and an IP-hash rate limit. Its helpers live in plain modules (`lib/requests/`, `lib/website/`), never in `"use server"` files.
  - Add a sentence under Business rules: **Requests.** Every booking from the site is saved before anyone is notified; it is never deleted, but personal details can be erased.
- [ ] **Step 2: List the env vars** in `.env.example`: `WEBSITE_ORIGINS`, `TURNSTILE_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `REQUESTS_EMAIL_TO`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- [ ] **Step 3: Run the full check, one tool at a time.** `pnpm lint`, `NODE_OPTIONS=--max-old-space-size=2500 pnpm typecheck`, `pnpm test`, `pnpm db:check`, then `pnpm build` with the dev server stopped. Expected: all pass. Report any failure with its output; don't skip it.
- [ ] **Step 4: Commit.** `git add AGENTS.md .env.example && git commit -m "docs: the public booking API and its settings"`.
- [ ] **Step 5: Check the repo's visibility,** then open the PR. Run `gh repo view --json visibility`. Then `git push -u origin feat/website-bookings` and `gh pr create`. The body lists what the owner must do **before** merging: apply `0003_booking_requests.sql` to production, set the Vercel env vars, and generate the production VAPID keys. After deploy, Ouarda installs the dashboard on her home screen and turns notifications on, and a real booking sent from the site arrives three ways. Only after the user asks: push and open the PR.

### Task 11 (website repo, separate PR): the form posts to the dashboard

**Repo:** `/home/whybe/projects/jnaninyoga`, branch `feat/bookings-to-dashboard`. This ships only after Task 10's PR is deployed and its migration is on production.

**Files:**

- Modify:
  - `src/components/sections/BookingForm.tsx`
  - `src/content/fr.ts` and `src/content/en.ts` (privacy copy, the success line with the ref)
  - `public/_headers` (CSP `connect-src` adds the dashboard origin)
  - `README.md`, `.env.example`, `docs/cloudflare-setup.md` (drop the email steps and keep Turnstile)
- Delete: `functions/api/contact.ts`

**Interfaces:**

- Consumes: `POST ${NEXT_PUBLIC_BOOKING_API_URL}` (Task 4), with the body `{ name, phone, choice: <label>, choiceKey: <the select's value, e.g. "plan:start-to-align">, message, lang, website, filledMs, token }`. The answer is `{ ok, ref }`.

- [ ] **Step 1: Post to `process.env.NEXT_PUBLIC_BOOKING_API_URL`** (default `https://dash.jnaninyoga.com/api/public/v1/requests`). Send `choiceKey`, read `ref` from the answer, and show it under the sent message ("Your reference: WEB-1A2B3C4D" / "Votre référence : …"). Any non-200 answer keeps today's WhatsApp offer.
- [ ] **Step 2: Remove the Pages Function and its email env docs.** Update the privacy page: requests are kept in the studio's own system, used only to reply and organise the session, and erased on request.
- [ ] **Step 3: Add the dashboard origin to `connect-src`** in `public/_headers`.
- [ ] **Step 4: Check against the local dashboard.** Run the site with `npx next dev -p 3100` and `NEXT_PUBLIC_BOOKING_API_URL=http://localhost:3000/api/public/v1/requests`, with the dashboard's `WEBSITE_ORIGINS=http://localhost:3100`. Send a booking at 390px. Expected: the sent message shows a `WEB-` ref, and the request appears in the local dashboard's `/requests`.
- [ ] **Step 5: `npm run lint && npm run typecheck && npm run build`.** Expected: all pass. Commit, then open the PR when the user asks.
