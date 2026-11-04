# Free deployment guide

Always test a production build before deployment:

```bash
npm ci
npm test
npm run check:data
npm run build
```

The built frontend is in `dist/`. HTTPS is required for installation and GPS on a public URL.

## Option 1 — Netlify (student PWA only)

Best for the simplest free demonstration. Static hosting includes the map, router, course search, timetable, favorites and offline worker. It does **not** include the Express admin API or photo uploads.

1. Create a GitHub repository and push this project, or prepare the local `dist/` folder.
2. Sign in to Netlify with GitHub.
3. Choose **Add new site → Import an existing project**.
4. Select the repository and use:
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
5. Deploy, open the generated HTTPS URL, and test the student app.
6. For a manual deploy, run `npm run build` and drag the `dist/` folder into Netlify Drop.

The included `public/_redirects` file contains `/* /index.html 200`, so deep links resolve correctly after Netlify copies it into the build.

Without the API, `/admin` cannot authenticate; hide that link in a student-only static release if desired.

## Option 2 — Vercel (student PWA only)

1. Push the project to GitHub and choose **Add New → Project** in Vercel.
2. Import the repository. Vercel detects Vite.
3. Confirm:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm ci`
4. Deploy and test the HTTPS URL.
5. This guide uses Vercel as static hosting. Do not expect `server/index.js` to run automatically as a persistent Express process.

## Option 3 — Render (complete app and admin API)

1. Push the repository to GitHub.
2. In Render, choose **New → Web Service** and connect the repository.
3. Select the Node runtime and enter:
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
4. Add an environment variable:
   - Key: `ADMIN_PASSWORD`
   - Value: a long, unique password stored only in Render’s secret settings
5. Render sets `PORT` automatically; the server already respects it.
6. Deploy. Open `/` for students and `/admin` for staff.

### Important free-tier limits

- Free services may sleep when idle, so the first request can be slow.
- A free instance’s filesystem may be reset during redeploy/restart. GeoJSON admin edits and uploaded photos are not a durable production database.
- Use **Admin → Import & export → Download GeoJSON** for backups.
- Before a real launch, move data to a managed free PostgreSQL/Supabase database and photos to persistent object storage, or attach a suitable persistent disk on your hosting plan.
- Restrict admin access using strong credentials and university operational controls. The MVP has one shared password, not individual staff accounts.

## GitHub Pages note

GitHub Pages can host a static PWA, but project sites normally live under `https://username.github.io/repository/`. This starter uses root-relative service-worker, icon and data URLs, so Netlify/Vercel are simpler and less error-prone. If you must use GitHub Pages, configure Vite’s `base`, the manifest `start_url`/`scope`, service-worker scope, and all public asset URLs for the repository subpath. It still will not run the admin API.

## Custom domain and launch

1. Add the university-approved subdomain in the host’s domain settings.
2. Create the DNS records shown by the host and wait for HTTPS to activate.
3. Replace all placeholder data before announcing the URL.
4. Test GPS and installation on real Android and iPhone devices.
5. Verify OSM attribution remains visible.
6. Export a final backup and record who owns passwords, DNS and future updates.

## Updating an existing deployment

For Git-connected hosts, push to the configured branch; the host rebuilds automatically. Then hard-refresh once to activate the new service worker. Because the cache name changes only when `VERSION` in `public/sw.js` changes, increment that version whenever cached core assets or offline behavior changes.
