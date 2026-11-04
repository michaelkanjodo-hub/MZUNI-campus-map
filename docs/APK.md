# Install the PWA and build an Android APK

## Easiest option — install directly from the browser

No app store or APK is needed.

### Android / Chrome

1. Open the deployed **HTTPS** app URL.
2. Wait for the campus data to load once.
3. Open Chrome’s **⋮** menu.
4. Tap **Install app** or **Add to Home screen**, then confirm.
5. Launch from the MZUNI icon and allow location only if you want GPS routing.

### iPhone / Safari

1. Open the HTTPS app in Safari.
2. Tap the **Share** button.
3. Choose **Add to Home Screen**.
4. Tap **Add**, then launch from the home-screen icon.

The installed PWA retains campus data, timetable, favorites and cached map tiles subject to browser storage limits. Do not clear site data if you need offline access.

## Wrap the PWA with Capacitor

Capacitor creates a native Android shell around the same `dist/` application. It is free and open source. You still need Android Studio and the Android SDK, which are large downloads.

### 1. Prepare your computer

1. Install Node.js 20+ and Android Studio.
2. In Android Studio’s SDK Manager, install a current Android SDK and platform tools.
3. Make sure Java/Android Studio can run an emulator, or enable USB debugging on a physical Android phone.

### 2. Add Capacitor

From the repository root:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "MZUNI Campus" "mw.ac.mzuni.campus" --web-dir=dist
npm run build
npx cap add android
npx cap sync
```

The `android/` directory is generated. It is ignored by Git in this starter because native projects can be large; your release team may choose to commit it after reviewing the files.

### 3. Open and test in Android Studio

```bash
npx cap open
```

In Android Studio:

1. Wait for Gradle sync to finish.
2. Choose an emulator or connected phone.
3. Click **Run**.
4. Test search, routes, timetable, offline relaunch and GPS.
5. If Android requests location permission, allow it only while using the app.

### 4. Build a test APK

Choose **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Android Studio shows where the debug APK was created, commonly:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Copy it to a test phone and install it. Android may warn because the APK did not come from the Play Store. Only install APKs you built and trust.

### 5. Build a public release

A debug APK is not a production release. For university distribution:

1. Create a university-owned signing keystore and keep secure offline backups. If the key is lost, updates become difficult or impossible.
2. Configure signing in Android Studio; never commit passwords or keystore files to Git.
3. Use **Build → Generate Signed Bundle / APK**.
4. Generate an **Android App Bundle (`.aab`)** for Play Store, or a signed APK for direct distribution.
5. Add a privacy policy, app screenshots, content rating, data-safety declarations and university contact details.
6. Test the signed release on low-end phones before publishing.

## API and admin behavior in the native shell

The student app’s bundled `/data/campus.geojson`, search, routing, timetable and offline behavior work in the WebView. The relative `/api` URL only reaches your Express server when the web server and frontend share an origin. For live admin-managed content in a native app:

1. Deploy the Express API at a public HTTPS domain.
2. Configure a typed API base URL for native builds rather than hard-coding `localhost` (a phone cannot reach your computer through `localhost`).
3. Keep `/data/campus.geojson` as the offline fallback.
4. Do not embed the admin password in the app. Staff should use the separate HTTPS admin dashboard.

For the simplest APK pilot, use the bundled verified dataset and omit the staff dashboard from the native interface.

## After changing web code

Rebuild and copy the assets before reopening/rerunning Android:

```bash
npm run build
npx cap sync
npx cap open
```
