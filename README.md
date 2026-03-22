# Swift Help

Monorepo for the Swift Help product.

## Project Layout

- `web/` - Next.js frontend (App Router, TypeScript)
- `mobile-expo/` - mobile app workspace

## Run the Web App

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Web Scripts

From `web/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current Main Routes (Web)

- `/` - Landing page
- `/signup`
- `/get-started` - Welcome page
- `/get-started/create-account`
- `/get-started/otp`
- `/onboarding/health-profile`
- `/onboarding/health-profile-2`
- `/otp` - legacy redirect to `/get-started/otp`

## Deployment (Vercel)

If deploying the web app on Vercel, use:

- **Root Directory:** `web`
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (default)

## Notes

- Node.js 18+ is recommended.
- Assets used by the landing and onboarding pages are in `web/public/`.
