# Hosting Attendly

Nothing has been published. These steps are for when you decide to deploy.

## Option 1: website and backend together on Cloudflare

This is the smallest setup because the included backend uses Cloudflare Workers and D1. The local project works without a Cloudflare account. Remote deployment requires your own account.

1. Install dependencies and sign in:

   ```sh
   pnpm install
   pnpm exec wrangler login
   pnpm exec wrangler d1 create attendly
   ```

2. Copy the returned database ID into `wrangler.jsonc` as `d1_databases[0].database_id`, replacing the all-zero local placeholder. Keep binding name `DB` and migrations directory `drizzle`.

3. Set `vars.ALLOWED_ORIGINS` to the exact frontend origins you use, separated by commas. The backend’s own origin is accepted automatically. Include `https://localhost` for the packaged Android app. Remove local development origins from the hosted configuration when you no longer need them. No wildcard is used.

4. Build and deploy:

   ```sh
   pnpm build
   pnpm exec wrangler d1 migrations apply attendly --remote
   pnpm exec wrangler deploy
   ```

5. Open the HTTPS URL Wrangler returns, create an account and save its recovery code. The remote database starts empty; local accounts are not automatically migrated. Export your local workspace JSON and import it into your remote account.

6. For Android, set `VITE_API_URL` to that HTTPS origin, rebuild and run `pnpm android:sync`. Sign in to the same remote account on both devices.

References: [Workers static assets](https://developers.cloudflare.com/workers/static-assets/), [D1 setup](https://developers.cloudflare.com/d1/get-started/), [Capacitor Android](https://capacitorjs.com/docs/v7/android).

## Option 2: Vercel, Netlify or GitHub Pages frontend

The frontend is static Vite output. It can be hosted separately while the account API and D1 database remain on Cloudflare. A static-only host cannot run this account backend on its own.

1. Deploy the backend using Option 1.
2. Configure the frontend build environment:

   ```dotenv
   VITE_API_URL=https://YOUR-BACKEND-ORIGIN
   ```

3. Add the exact frontend origin to the backend’s `ALLOWED_ORIGINS`, keeping `https://localhost` if you use Android; redeploy the backend.
4. Use `pnpm install --frozen-lockfile`, build command `pnpm build`, and publish/output directory **`dist/client`**. Use Node.js 22 or newer. The included `netlify.toml` and `vercel.json` set the output directory.
5. For GitHub Pages, upload `dist/client` with a Pages deployment workflow. Vite’s relative base (`./`) supports a project subdirectory. This app uses in-page navigation and needs no server route rewrites.

Never place credentials in a `VITE_*` environment variable; those values are compiled into public JavaScript. `VITE_API_URL` contains only a public origin, not a secret.

See [Vite’s deployment documentation](https://vite.dev/guide/static-deploy.html) for each provider’s current setup.

## Operation

- Use HTTPS for deployed frontends and APIs. The Android configuration rejects mixed content.
- Keep the database and its backups. Exporting a workspace backs up its attendance data, not the whole account database.
- Account sessions expire after 30 days. Password recovery uses the one-time-shown recovery code and revokes existing sessions. There is no email service or email verification dependency.
- Login throttling is included. For a broad public launch, review the app’s account/security design and configure platform abuse protection for your expected audience; this personal app has not undergone an independent security audit.
- Timetable/holiday images are processed on the device. Recognized data is saved only after the user reviews it. No API key is needed for OCR.
- Update database schemas with new migrations. Do not edit an already applied migration.
- The generated service worker caches the app and local OCR assets. It does not cache account API responses. A new build gets a new cache version.
- Keep backups before clearing browser storage, removing the app, changing the API host, or discarding a conflicting local copy.
