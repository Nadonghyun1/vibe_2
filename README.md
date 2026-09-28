# 노가정 홈페이지

Production: https://nogajeng.vercel.app

Domain: nogajeng.helionlife.net (Cloudflare DNS setup pending)

Static website served from `public/` on Vercel. Edit menu names, prices, notes and image mappings in `public/menu.json`. Edit page content in `public/index.html`. Styles and interactions are in `public/style.css` and `public/app.js`.

## Local preview

`python -m http.server 4173 --bind 127.0.0.1 --directory public`

## Publish

`vercel deploy --prod --scope luo13`

GitHub repository: Nadonghyun1/vibe_2. Vercel project: luo13/nogajeng.

## Reservations

Online reservations are saved through `/api/reservations` in a private Vercel Blob store (Seoul). Guests receive a reservation ID and a private lookup code for status lookup/cancellation. Staff sign in at `/admin.html` to confirm, cancel, complete or delete ended reservations, and close dates to new requests. A pending request is never shown as confirmed.

Admin credentials are in `.private/관리자-접속안내.txt`, excluded from Git and deployment. Keep this file private. Secrets live in Vercel production environment variables. To rotate the administrator password, update `ADMIN_PASSWORD_HASH` with SHA-256 of a new strong password and rotate `SESSION_SECRET`, then redeploy. Rotating the session secret invalidates admin sessions; existing guest lookup codes still work, but old create-request retry keys should not be reused.

No automatic SMS/email is sent. Staff must check the admin dashboard and can use its phone/SMS links to contact guests. Purchases, payments and ordering are excluded. Email is deferred by agreement.

The API validates Korea-time dates, the 90-day booking window, Seollal/Chuseok holidays, half-hour time slots 10:00–20:30, 1–100 guests, phone number and explicit consent. The staff confirms seating availability manually; submissions do not reserve automatic inventory. Private state updates use consistent reads and ETag conditional writes/retries to avoid lost updates. The GET response's weak ETag prefix is removed before conditional writes. Random create request keys provide idempotent retries; session cookies are HttpOnly/Secure/SameSite=Strict, and mutations require an allowed Origin. Authentication/lookup/create rate limits are persisted.

`/api/cleanup` is authenticated with `CRON_SECRET` and scheduled daily at 18:00 UTC. Records past 30 days after the visit are removed, also during subsequent writes. Dates closed by staff do not cancel existing requests. Consent and contact details are stored only in the private store; IPs are HMAC-hashed for short-term abuse limits.

## Pending content

- Egg custard price (shown as phone inquiry).
- Whether fried shrimp includes udon; keep shrimp as a text menu until confirmed.
- Deodeok photo (text menu shown).
- Parking details (phone inquiry).
- No claim of government certification or grant approval is published.
- The 100-year history refers to the house, not the duration of restaurant operation.
- User-approved retouched venue images are labeled as retouched; original files remain untouched.

## DNS

Cloudflare: CNAME `nogajeng` → `d8160e39a44ec6b1.vercel-dns-017.com`, DNS only (proxy disabled), TTL Auto.
Do not change root domain records or nameservers.
Verify: `vercel domains verify nogajeng.helionlife.net --scope luo13`

## Validation

`node check-site.cjs` validates deployed menu count/filtering, image load, reservation bounds, mobile overflow and reduced motion with Edge/Playwright.

`node --test test-reservations.cjs` validates booking dates, holidays, inputs, rate limits and session authentication. `node check-booking-live.cjs` performs an actual synthetic booking/confirm/lookup/cancel/idempotency/date-closure check and removes only its own test records. It reads the admin password from the ignored local file and sends no messages.
