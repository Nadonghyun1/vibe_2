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

Phone and SMS links work on supported devices. The form composes an SMS for the guest to send, or copies the request. It does not store bookings or claim successful submission. The restaurant must confirm reservations. Email, online booking persistence, payment and online ordering are deferred by agreement.

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

`node check-site.cjs` validates deployed menu count/filtering, image load, reservation bounds, copy action, mobile overflow and reduced motion with Edge/Playwright. It does not send an SMS or book a table.
