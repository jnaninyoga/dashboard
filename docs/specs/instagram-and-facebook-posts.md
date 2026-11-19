# Design: post an outdoor session to Instagram and Facebook

Status: approved 2026-11-19. The owner's answers to the [open questions](#open-questions-for-the-owner) are pending; until they come, the spec assumes each recommendation. Nothing is built.

An outdoor session is already the event the website shows (see [website-from-the-command-center.md](website-from-the-command-center.md)): its French and English text, place, price, photo and page at `jnaninyoga.com/evenements/<slug>/`. This spec adds one thing: from that session's page, Ouarda posts it to the studio's Instagram account and Facebook Page in one go.

## Why

Today, announcing an outdoor session means writing it twice more. She opens Instagram, finds the photo, rewrites the date, place and price, then does it again on Facebook, on her phone, between classes. The facts are already in the dashboard, so the dashboard should draft the post and send it.

## Goals

1. From an outdoor session on the website, she posts to Instagram and Facebook with two taps (Post, then confirm) and sees a link to each post within about 20 seconds.
2. The post is drafted for her: the photo framed for Instagram, and a French caption with the title, day, time, place, price, description and how to book. She can edit the caption before posting.
3. She connects the studio's Instagram and Facebook once, in Settings, and is told plainly when the connection needs renewing.
4. When Instagram and Facebook can't be reached or the connection has lapsed, she can still copy the caption and download the framed photo, and post them herself.

## Non-goals

- **Scheduling posts for later.** She posts when she taps Post.
- **Stories, Reels and carousels.** One photo and its caption.
- **Editing or deleting a post from the dashboard.** She does that in the apps; the dashboard links to each post.
- **Comments, messages, insights or follower counts.** No KPI charts (AGENTS.md).
- **Posting anything other than outdoor sessions,** such as cards or classes. It can come later on the same connection.
- **Other networks** (TikTok, WhatsApp channels) and AI-written captions.

## Anti-goals (failures even if it "works")

- **Posting something she didn't see.** Every post is previewed and confirmed. Nothing posts on its own.
- **Posting twice** because of a double tap, a second tab or a retry.
- **A lapsed connection failing silently.** She learns it from Settings, or from the session's page before she taps Post, never from followers.
- **A token leaving the server**: in a log, an API response, a client bundle or a commit. The repository is public.
- **Posting to her real accounts from a developer's machine.** Development uses test accounts.
- **One network's failure undoing the other's post,** or a slow Meta blocking her page.

## Constraints

- **Meta fetches the photo itself** from a public URL, so the URL must be reachable from the internet. For Instagram the photo must be a JPEG of at most 8 MB, between 4:5 (portrait) and 1.91:1 (landscape). Event photos are stored as WebP today (`lib/utils/photo.ts`), at most 1600 px on the long side.
- **Instagram captions** hold up to 2,200 characters and 30 hashtags, and links in them can't be clicked ("lien en bio"). Facebook captions can carry a clickable link.
- **Meta's app rules.** Posting needs a Meta app with Facebook Login for Business. In Development mode, only people with a role on the app can connect. That suits a single-owner studio and should avoid App Review, which slice 0 confirms.
- **Instagram must be a professional account** (Business or Creator) linked to the studio's Facebook Page, and the person connecting must manage that Page.
- **Meta caps posts made through the API** at 50–100 per account per day (its own pages disagree). She posts a few a month.
- **Production database and deploys** (AGENTS.md). Each slice's migration reaches production before its code ships. Develop against `jnanin-pg-dev`.
- **Time and money.** Studio time goes through `lib/utils/time.ts` and is never a hard-coded offset. Times made on the server are only right with current time-zone data (Node 24.12 still puts Morocco on UTC+1). The caption is a public text like the website, which writes prices as "350 Dh" (see open question 2).

## Approaches considered

1. **The dashboard posts through Meta's Graph API.** *Recommended.* It's one tap inside the screen she already uses for the session, with no new service or fee, and nothing leaves for a third party. The cost is a Meta app to set up and a connection that occasionally needs renewing.
2. **A scheduling service** (Postiz, Buffer, Make). Faster to wire up, but it's another account to keep signed in, often a monthly fee, the event's data passes through a third party, and her day moves to another app.
3. **A share kit only.** "Copy caption" and "Download photo", then she posts through Meta Business Suite, which posts to Instagram and Facebook together. No Meta app and no risk, but 6–8 taps across two apps. It is kept as slice 1, and as the fallback whenever the connection is down.

## What the owner decided

- One action posts the session to **both** her Instagram account and her Facebook Page (2026-11-19).
- What gets posted is an **outdoor session that's on the website**: the event she already publishes there.

## Open questions for the owner

Each has a recommendation; the spec is written assuming it.

1. **Caption language.** French only, or French and then the English below it when the English text is written? *Recommended: French, then English when written.* Marrakech's visitors read both, and she already writes both for the website.
2. **Prices in the caption.** "350 Dh" like the website, or "350 MAD" like the dashboard? *Recommended: "350 Dh",* because the caption speaks to the same people as the website.
3. **Hashtags.** A short set added to every post, editable in Settings, or none? *Recommended: a set she edits once,* for example `#yoga #marrakech #yogamarrakech #jnaninyoga`.
4. **When it posts.** Only when she taps Post, or automatically when a session goes on the website? *Recommended: only when she taps Post.* A post can't be unsent, and she should see the framing and caption first.
5. **Her Instagram bio link.** Does it point to `jnaninyoga.com/evenements/`? The Instagram caption says "lien en bio", so it should.
6. **Who owns the Meta app.** A Business portfolio in the studio's name, with the developer as an admin, or the developer's personal Meta account? *Recommended: the studio's portfolio,* so the studio never depends on one person's account.

## The design

### 0. First, prove the connection (spike, before any code is merged)

Meta's documentation disagrees with itself on two points this design rests on. With the Meta app in Development mode, a test Facebook Page, a linked test Instagram account and the Graph API Explorer, confirm:

- that a **Page access token** can publish to the linked Instagram account (`POST /{ig-user-id}/media`, then `media_publish`). The overview lists it; the `media_publish` reference names a user token.
- that the Page token made from a long-lived user token **has no expiry** (`debug_token` shows `expires_at: 0`). If Instagram insists on the user token, it lasts about 60 days, and the design adds a "Reconnect by <date>" reminder in Settings and on the section.
- that **Facebook Login for Business can return a system-user token set to never expire** for the chosen Page and Instagram account, and what that requires. If it works without App Review, use it instead.
- that someone with only a **tester role** can connect without App Review or business verification.
- that **Meta can fetch an image** from `dash.jnaninyoga.com/api/public/...` (no bot challenge in front of it).

Record the outcome in this spec. The rest of the design assumes the Page token works for both networks.

### 1. Data (dashboard database)

**`social_connection`**: the studio's single connection to Meta.

| Column | Notes |
| --- | --- |
| `id` | text primary key, always `"meta"`: there is only one |
| `page_id`, `page_name` | the Facebook Page |
| `instagram_id`, `instagram_username` | the linked Instagram account; null if the Page has none |
| `token` | the Page access token, **encrypted** (AES-256-GCM, key `SOCIAL_TOKEN_KEY`) |
| `token_expires_at` | null when it doesn't expire |
| `connected_by` | `users.id` |
| `connected_at`, `checked_at` | `checked_at` is the last time Meta accepted the token |
| `broken_at` | set when Meta refuses the token (error 190); cleared on reconnect |

Google tokens are stored unencrypted today (Better Auth's `accounts`). This token can publish to the studio's public accounts, so it is encrypted from the start. Moving Google's tokens to the same protection is a separate change.

**`social_images`**: the framed JPEG Meta fetches, one per session.

| Column | Notes |
| --- | --- |
| `session_id` | primary key, references `studio_sessions` (cascade) |
| `data` | JPEG bytes, 4:5, at most 1080 × 1350 |
| `framing` | where she placed the frame, 0–1 along the photo's long side, so she can adjust it again |
| `photo_version` | the `session_photos.updated_at` it was made from; a new photo makes it stale |
| `updated_at` | versions the public URL |

**`social_posts`**: one row per post attempt on one network.

| Column | Notes |
| --- | --- |
| `id` | uuid |
| `session_id` | references `studio_sessions` |
| `network` | enum `instagram`, `facebook` |
| `status` | enum `posting`, `posted`, `failed` |
| `caption` | exactly what was sent |
| `container_id` | Instagram's container, kept so a slow post can be finished later |
| `external_id`, `permalink` | the post, once published |
| `error` | in her words, when `failed` |
| `starts_at_posted` | the session's start when posted, to notice a later move |
| `created_by`, `created_at`, `posted_at` | |

A partial unique index on `(session_id, network)` where `status <> 'failed'` makes "posted twice" impossible at the database level. A failed attempt stays as history, and a retry is a new row.

### 2. The Meta client (`services/meta/`)

It sits beside `services/google/`, with plain `fetch` and no SDK.

- `graph.ts`: calls `graph.facebook.com/<version>` with the version pinned in code and changed deliberately. Every call carries `appsecret_proof` (HMAC-SHA256 of the token with `META_APP_SECRET`) and has a 10-second timeout. Errors map to a small set of kinds (connection lapsed, permission missing, photo refused, daily limit reached, blocked as spam, Meta unavailable) with her words for each.
- `oauth.ts`: exchanges the code, gets the long-lived user token, lists her Pages with their tokens and linked Instagram accounts (`/me/accounts?fields=id,name,access_token,tasks,instagram_business_account{id,username}`), and runs `debug_token`.
- `instagram.ts`: creates a container (`image_url`, `caption`), reads its `status_code`, publishes it, and reads the post's `permalink`.
- `facebook.ts`: posts a photo to the Page (`POST /{page-id}/photos` with `url` and `message`), and builds the post's link.

The client takes a `fetch` so tests run without the network. Tokens never appear in errors it throws or in anything passed to `logServerError`.

### 3. Connecting (Settings → Instagram & Facebook)

This is a new Settings page, `/settings/social`, in her words: "Instagram & Facebook".

- **Not connected:** one sentence on what it does, and **Connect**.
- **Connect** goes to `GET /api/meta/connect`, a route handler that runs `requireUser()`. It sets a random `state` in an httpOnly, SameSite=Lax cookie and redirects to Meta's login dialog with `config_id` (`META_LOGIN_CONFIG_ID`) and the redirect URI `<NEXT_PUBLIC_SITE_URL>/api/meta/callback`.
- **`GET /api/meta/callback`** checks the session and the `state`, exchanges the code, takes the long-lived user token, then finds the Page that has an Instagram account linked. It saves the Page's token encrypted, and redirects back to Settings with the result. If she manages several Pages, she picks one there. A Page without a linked Instagram account connects Facebook only, and Settings says how to link Instagram.
- **Connected:** "Facebook Page **<name>** · Instagram **@<username>**", with **Disconnect** (deletes the row; revoking the app's permission on Meta is left to the builder).
- **Lapsed** (`broken_at` set): "Instagram & Facebook need reconnecting", with **Reconnect**. Meta is asked about the token in the daily cron (`/api/cron/rebuild-website` already runs once a day, which avoids another Vercel cron) and whenever a post is refused with error 190.

### 4. The post: photo and caption

**The photo.** In her browser, from the session's website photo, the same way `components/events/event-photo.tsx` already resizes uploads:

- a 4:5 frame over the photo; she drags the photo along its long side to place it;
- encoded as a JPEG, at most 1080 × 1350;
- saved by `saveSocialImageAction`.

The crop rectangle is a pure function, `cropRect(width, height, aspect, framing)` in `lib/domain/social/crop.ts`, tested on its own. A photo smaller than the frame is used as it is, never stretched past its own size (Instagram scales it).

**The public URL** Meta fetches is `GET /api/public/v1/events/<slug>/social?v=<updated_at>`. It's served only while the session is on the website, under the same rule as the event photo (`publicPhotoBySlug`), with the same caching. It holds nothing that isn't already public on the website.

**The caption.** It is drafted by `eventCaption(session, { network, lang, hashtags, siteUrl })` in `lib/domain/social/caption.ts`, from the session's own fields. She can edit it before posting, and what she sends is stored on the post. The day and time use the website's French wording. Instagram:

```text
Yoga au lever du soleil à l'Agafay
Samedi 28 novembre · 8h – 10h
📍 Désert d'Agafay
350 Dh par personne · places limitées

Deux heures de yoga doux face aux dunes de pierre de l'Agafay, au lever du soleil. Thé à la menthe offert après la séance. Tapis fournis.

Réservation : lien en bio.

#yoga #marrakech #jnaninyoga
```

Facebook gets the same text, with `Réservation : https://jnaninyoga.com/evenements/<slug>/` in place of "lien en bio". When the English is written (open question 1), an English block follows the French. "Places limitées" appears when the session has a limit; the number left changes, and a post doesn't. Validation (`lib/validators/social.ts`) caps the Instagram caption at 2,200 characters and 30 hashtags.

### 5. Posting (`lib/actions/social.ts`)

`postEventAction(sessionId, { caption, instagram, facebook })`:

1. `await requireUser()`, and validate the input.
2. Refuse, in her words, when:
   - the session isn't on the website or is cancelled;
   - it has already ended;
   - it has no framed photo, or the photo changed since it was framed;
   - the connection is missing or lapsed.
3. For each chosen network, insert a `posting` row. The unique index turns a double tap or a second tab into "Already posted".
4. Post to Instagram and Facebook **at the same time**. Each finishes or fails on its own:
   - **Instagram:** create the container, then check its status every second for up to 15 seconds. `FINISHED` → publish, read the link, `posted`. `ERROR` or `EXPIRED` → `failed`, with why. Still processing after 15 seconds → the row stays `posting` with its container, and the page offers **Check again** (`finishInstagramPostAction`), which publishes once Meta has the photo. Publishing a container twice is refused by Meta, so this can't post twice.
   - **Facebook:** one request; `posted` with the post's link.
5. An unexpected failure is logged with `logServerError(scope, error)` (never the token) and returned as `{ error, ref }` for that network. The page shows it with `notifyActionError`.

A Facebook request whose answer never arrives leaves a `posting` row. After two minutes the page says "Facebook didn't confirm. Check the Page; if the post isn't there, try again." **Try again** marks that row failed and posts again. She checks first, which is the only way to rule out a double post here.

### 6. On the session's page

The section sits on `/schedule/outdoor/[eventId]` after the website form, under the shared section pattern (AGENTS.md): the title "Instagram & Facebook" on the page background, its status on the right, then one framed container. Phone first: the photo preview takes at most half the screen's height, the caption is a textarea with a character count, two switches (Instagram, Facebook; both on), and one **Post** button. **Post** opens `useConfirm()`: "Post to Instagram and Facebook? Your followers will see it right away."

| State | What she sees |
| --- | --- |
| Not on the website yet | "Once this session is on the website, you can post it." The post links to its page. |
| No photo | "Add a photo for the website first." |
| Not connected, or lapsed | The framed photo and the caption, with **Copy caption** and **Download photo**, and "Connect Instagram & Facebook in Settings" (or "Reconnect"). |
| Ready | Frame, caption, switches, **Post**. |
| Posting | "Posting…", then each network's result as it arrives. |
| Posted | "Posted on Instagram · 19 Nov, 14:02 · View" and the same for Facebook. A network not yet posted keeps its switch and **Post**. |
| One failed | Why, in her words, and **Try again**, which posts that network only. |
| Instagram still processing | "Instagram is still preparing the photo", with **Check again**. |

### 7. When the session changes after posting

The dashboard never edits or deletes a post. It tells her, and links to each post:

- **Cancelled** (from the dashboard, or deleted in Google Calendar and then cancelled): "You posted this session. Tell your followers it's cancelled." It shows on the cancelled session's page and in the cancel confirmation.
- **Moved** (its start differs from `starts_at_posted`, including a move made in Google Calendar and followed by `lib/events/calendar-sync.ts` from PR #23): "The date changed after you posted it."

### 8. Security and privacy

- Every server action starts with `requireUser()`. The two OAuth route handlers check the session themselves, and the callback checks `state`.
- The Page token is decrypted only inside `services/meta/` calls, on the server, and is never sent to the browser or logged. `appsecret_proof` on every call means a leaked token alone can't be used.
- Meta receives only what the website already shows: title, day, place, price, description and photo. Never a client's name or phone.
- `.env.example` gets a "Instagram & Facebook" section: `META_APP_ID`, `META_APP_SECRET`, `META_LOGIN_CONFIG_ID`, `SOCIAL_TOKEN_KEY` (generate with `openssl rand -base64 32`), and an optional `SOCIAL_IMAGE_BASE_URL` for a development tunnel. The section is added in the same order to `.env` and `.env.local`. Production values are set in Vercel.

### 9. Delivery order

Each slice is one PR. Its migration reaches production before its code ships.

0. **Spike** (section 0). Nothing merged; the outcome is written into this spec.
1. **Share kit.** `social_images`, the framing, the public image route, the caption builder, and the section with **Copy caption** and **Download photo**. Useful on its own, before any Meta setup.
2. **Connection.** The env variables, `services/meta/`, `social_connection` with encryption, Settings → Instagram & Facebook, the OAuth routes, and the daily check.
3. **Posting.** `social_posts`, the actions, the section's states, retries, and the reminders when a posted session changes.

### 10. Verifying it

- **Unit tests** (Vitest):
  - `eventCaption` in French, in French and English, with and without a limit, place or English, and at the length limits;
  - `cropRect` for portrait, landscape, square and small photos;
  - the Graph client with a fake `fetch`: `appsecret_proof`, timeouts, every error kind;
  - encryption: a round trip, and a refused tampered value;
  - the validator.
- **The local database harness** (AGENTS.md), with a fake Meta: two posts racing for the same session and network (one wins); a lapsed token marks the connection; one network failing leaves the other posted.
- **The browser:** the section's states on `/dev/playground` at 320 px, 390 px and desktop, with no sideways scroll and the confirm dialog.
- **End to end, with test accounts:** run the dashboard locally behind a tunnel (`cloudflared tunnel --url http://localhost:3001`, `SOCIAL_IMAGE_BASE_URL` set to it), connect the test Page and Instagram account, post, and check both posts, the links and a retry.
- **CI:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:check`, `pnpm build`.
- **In production:** her first real post, with her approval, from her phone.

## What the owner needs to provide

- Her **Instagram as a professional account linked to the studio's Facebook Page**, which she manages.
- Her **Facebook account added to the Meta app** as a tester (or admin), with the invitation accepted at developers.facebook.com.
- The **answers to the open questions**, including who owns the Meta app.
- The **privacy policy URL** Meta asks for: the website's Confidentialité page.
- Her approval of the **first real post**.

The developer provides the Meta app and its Facebook Login for Business configuration, the test Page and test Instagram account, and the Vercel variables.

## Left to the builder

- The exact framing gesture (drag, or a slider for keyboard users too), within the 4:5 frame.
- The polling interval and limit, within "about 20 seconds before saying it's still processing".
- The exact error wording per kind, in her words.
- The Page picker when she manages several Pages.
- Revoking the app's permission on Meta when she disconnects.
- Whether the framed JPEG is kept after posting (it is small; keeping it allows a later "Post again").
- The Graph API version pinned.

## Sources

- [Meta: Publish content using the Instagram Platform](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- [Meta: IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/) and [IG User Media Publish](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish)
- [Meta: Facebook Login for Business (Instagram)](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-login-for-instagram)
- [Meta: Access tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens) and [long-lived tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived)
- [Meta: Pages API, posts](https://developers.facebook.com/documentation/pages-api/posts) and [Page photos](https://developers.facebook.com/docs/graph-api/reference/page/photos)
