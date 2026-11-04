# MZUNI Campus Companion

An offline-first campus navigation PWA for **Mzuzu University, Malawi**. One responsive codebase works as a website and as an installable Android/iPhone app. It includes a student app, custom footpath routing, a personal timetable, and a password-protected staff dashboard.

> **Important:** every coordinate, room allocation, opening hour and phone number in the starter GeoJSON is **placeholder data — TO BE VERIFIED ON SITE**. Do not use the sample for real emergencies or accessibility decisions.

## 1. Project plan

| Stage | Delivered in this repository |
| --- | --- |
| Foundation | React + Vite PWA, mobile-first responsive design, blue/green/white theme, dark mode |
| Campus data | GeoJSON locations, rooms, indoor hints and a connected walking-path graph |
| Student MVP | Interactive Leaflet map, autocomplete/course search, GPS, path routing, categories, favorites, recents |
| Student planning | Personal timetable, next-class navigation and optional in-app reminders |
| Safety & inclusion | Emergency shortcuts, step-free route preference, accessible indoor hints |
| Offline | Service Worker, IndexedDB snapshots, localStorage personal data, bounded campus tile cache, vector fallback |
| Staff tools | Password login, place/room CRUD, photo uploads, hours, closures, announcements, GeoJSON import/export |
| Handover | Automated tests, validation script, setup/deployment/APK/testing guides |

### Why this stack?

- **React + Vite** is small, fast on low-end phones and easier to host than a server-rendered Next.js app.
- **Leaflet + OpenStreetMap** is free, familiar and lightweight. No API key or credit card is required.
- **A custom Dijkstra routing graph** works completely offline and respects campus paths, closures and accessibility flags. No paid directions API is needed.
- **Plain modern CSS** avoids a large UI framework and gives exact control over the mobile experience. Tailwind can be introduced later without changing the data or router.
- **Express + GeoJSON JSON storage** gives beginners a real REST API with zero database setup. It is appropriate for an MVP, not a high-traffic multi-admin deployment. Migrate to PostgreSQL/PostGIS or Supabase before relying on concurrent production edits.
- **PWA first** means one codebase. Capacitor can wrap the same build into an Android project.

## Folder structure

```text
MZUNI-campus-map/
├── public/
│   ├── data/campus.geojson       # Starter locations, rooms and routing paths
│   ├── icons/                    # Installable app icons
│   ├── images/                   # Local illustrative building images
│   ├── manifest.webmanifest      # PWA name, colors, icons and shortcuts
│   └── sw.js                     # Offline app/data/tile caching
├── src/
│   ├── components/               # Map, search, sheets, timetable, settings, admin
│   ├── hooks/useLocalStorage.js  # Persistent personal preferences
│   ├── lib/
│   │   ├── routing.js            # Dijkstra router and campus/course search
│   │   ├── storage.js            # IndexedDB campus snapshots
│   │   ├── data.js               # Live/static/offline data fallback
│   │   └── format.js             # Categories, dates and display helpers
│   ├── App.jsx                   # Student application state and navigation
│   ├── i18n.js                   # English dictionary; Chichewa/Tumbuka ready
│   ├── main.jsx                  # React entry + service-worker registration
│   └── styles.css                # Responsive UI and dark mode
├── server/
│   ├── index.js                  # Express REST API, auth, uploads and static hosting
│   └── store.js                  # Validated, atomic GeoJSON persistence
├── tests/routing.test.js          # Routing, closures, search and timetable tests
├── scripts/validate-data.js       # GeoJSON/node-connection validator
├── docs/                          # Beginner handover guides
├── index.html
├── package.json
└── vite.config.js
```

All application source files are complete and commented where the logic benefits from explanation. There are no “add the rest here” stubs.

## 2. Beginner setup — run it locally

### A. Install the tools

1. Install **Node.js 20 or newer** from <https://nodejs.org/>. The LTS version is the safest choice. Node includes `npm`.
2. Install **Visual Studio Code** from <https://code.visualstudio.com/> if you want a friendly code editor.
3. Open this project folder in VS Code, then open **Terminal → New Terminal**.
4. Check the tools:

   ```bash
   node --version
   npm --version
   ```

### B. Install and start the project

Run these commands from the repository root:

```bash
npm install
cp .env.example .env
```

On Windows Command Prompt, use `copy .env.example .env` instead of `cp`.

Open `.env` and replace the example admin password with your own private password. For local learning, you may keep the default temporarily.

```bash
npm run dev
```

Two processes start:

- Student website: **http://localhost:5173**
- Staff dashboard: **http://localhost:5173/admin**
- API health check: **http://localhost:3001/api/health**

For the local-only demo, the default admin password is `mzuni-admin`. Keep the terminal open while using the app. Press **Ctrl+C** to stop it.

### C. Test the production/offline version

Service workers are deliberately disabled in development so code changes are easy to see. To test installation and offline mode:

```bash
npm run build
npm start
```

Open **http://localhost:3001**, load the map once, then use your browser developer tools to simulate offline mode. The app shell, data and paths should continue to work.

### D. Useful commands

```bash
npm test                 # Automated routing/search/timetable tests
npm run check:data       # Validate the starter GeoJSON
npm run build            # Create the production website in dist/
npm run preview          # Preview only the static frontend
```

## 3. Add real Mzuzu University data

Read **[docs/DATA_COLLECTION.md](docs/DATA_COLLECTION.md)** for the full fieldwork and import process. In short:

1. Walk the campus with a phone and record latitude/longitude at each entrance.
2. Draw and verify footpaths in OpenStreetMap or export GPS traces.
3. Keep GeoJSON coordinates in **[longitude, latitude]** order (not latitude first).
4. Connect each building to a routing node using `nearestNode`.
5. Replace the starter file or import through **Admin → Import & export**.
6. Change `coordinateStatus` to `VERIFIED ON SITE` only after checking each feature.

## 4. Deploy for free

Full instructions are in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

- **Student-only static app:** deploy `dist/` to Netlify or Vercel. Search, routes, timetable and offline mode work. The Express admin API does not run on static hosting.
- **Complete app + admin:** deploy this repository as a Render Web Service using `npm ci && npm run build` and `npm start`. Set `ADMIN_PASSWORD` in the service environment.
- Free hosting can sleep and may not preserve JSON edits after a restart. Export backups regularly and use a persistent database/storage service for a real university launch.

## 5. Install on a phone and build an APK

### Install the PWA (no APK required)

1. Deploy the app or open its **HTTPS** production URL.
2. On Android Chrome, open **⋮ → Install app / Add to Home screen**.
3. On iPhone Safari, tap **Share → Add to Home Screen**.
4. Open the installed icon. Once loaded, core campus navigation works offline.

GPS needs a secure HTTPS website (or `localhost` during development). Browser location permission must also be allowed.

### Android wrapper

Follow **[docs/APK.md](docs/APK.md)**. The short version is:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "MZUNI Campus" "mw.ac.mzuni.campus" --web-dir=dist
npm run build
npx cap add android
npx cap sync
npx cap open
```

Then use Android Studio’s **Build → Build APK(s)**. A debug APK is for testing only; a public Play Store release needs a signed App Bundle and a university-owned signing key.

## 6. Testing checklist

The full checklist is in **[docs/TESTING.md](docs/TESTING.md)**. At minimum test:

- [ ] GPS accuracy indoors/outdoors, permission denied, timeout and no-GPS fallback
- [ ] First online load, then airplane mode: reload, search, details, routes and timetable
- [ ] Slow 2G/3G and high latency on a low-end Android device
- [ ] Closed path detour and step-free route selection
- [ ] Course search (`BIT 201`), room search (`B12`) and office search (`Registrar`)
- [ ] Timetable add/edit/delete, next class and reminder permission
- [ ] Favorites, recents, dark mode, keyboard navigation and large tap targets
- [ ] Admin login, every CRUD action, image size/type rejection and invalid GeoJSON
- [ ] Android/iPhone installation, safe areas, portrait layout and offline relaunch

Run `npm test` and `npm run check:data` before each release.

## 7. Future upgrades

See **[docs/FUTURE.md](docs/FUTURE.md)** for implementation ideas and sequencing:

- Chichewa and Tumbuka dictionaries with a language switcher
- PostgreSQL/PostGIS or Supabase, staff roles and audit history
- Real building polygons and entrance-level routing
- AR walking guidance using device camera + compass (with privacy review)
- Live shuttle tracking using GPS devices and WebSockets
- Push notifications through a consented Web Push service
- Indoor floor-plan maps, QR-code room check-ins and beacon experiments
- Offline map vector packs instead of raster tiles

## Privacy and open data

Favorites, recents, settings and timetable stay on the user’s device. GPS is used in the browser for routing and is not sent to the Express API. Map tiles are © OpenStreetMap contributors; retain the map attribution. Review OpenStreetMap’s tile usage policy before a large rollout and consider a dedicated vector-tile host for production scale.
