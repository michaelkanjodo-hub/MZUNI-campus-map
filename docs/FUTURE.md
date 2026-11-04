# Future upgrades

Prioritise verified data and reliable basic navigation before adding battery-intensive features.

## 1. Chichewa and Tumbuka

- Move all visible strings into `src/i18n.js` dictionaries (`en`, `ny`, `tum`).
- Add a persisted language switcher and language metadata to announcements.
- Let campus staff translate place descriptions and indoor hints without duplicating feature IDs.
- Test search aliases in all three languages, including alternative room spellings.
- Have native speakers and students review translations; do not rely only on machine translation.

## 2. Production database and staff operations

- Migrate GeoJSON features to PostgreSQL/PostGIS or Supabase; retain GeoJSON import/export.
- Add named staff accounts, roles (editor/publisher/emergency editor), audit history and approval workflow.
- Store photos in object storage with resizing and modern formats.
- Add verification dates, source, reviewer and per-route accessibility observations.

## 3. Richer maps and indoor navigation

- Use building polygons and entrance points instead of only building markers.
- Package campus vector tiles for smaller, more consistent offline downloads.
- Add floor-plan images and a floor selector, with a simple indoor graph for lifts/stairs/corridors.
- Place QR codes at selected entrances so a student can confirm “I am here” without relying on poor indoor GPS.
- Investigate Bluetooth beacons only after accuracy, maintenance and battery costs are understood.

## 4. AR navigation

- Prototype camera arrows using device orientation, GPS and the existing route graph.
- Require an explicit camera permission flow and avoid recording/uploading video.
- Provide a non-camera fallback and strong accuracy/safety warnings; AR should never encourage walking while looking at the phone.
- Expect accuracy limitations indoors and near buildings.

## 5. Live shuttle tracking

- Install authorised GPS trackers or use driver phones with explicit consent.
- Send timestamped positions to a secured backend and distribute updates using WebSockets or Server-Sent Events.
- Show route direction, stop estimates and stale/offline status rather than implying false precision.
- Cache the last known shuttle schedule for offline use.

## 6. Push notifications and timetable integration

- Add consented Web Push subscriptions and a backend using the `web-push` protocol.
- Send only useful notices: room changes, closures, emergency instructions and optional class reminders.
- Support per-topic opt-out and expiry of inactive subscriptions.
- Integrate official timetable data rather than asking students to re-enter every class, while preserving a manual fallback.
- Background reminders on iOS have platform limitations; test installed-PWA support on each target version.

## 7. Community feedback and analytics

- Add “Report wrong room/path” with category, optional photo and approximate location.
- Moderate reports before publishing and avoid exposing student identity or precise location history.
- Use privacy-preserving aggregate metrics such as failed search terms and route errors; avoid continuous GPS analytics.

## 8. Multi-campus and accessibility detail

- Support campus selection if Mzuzu University adds satellite sites.
- Record slope, surface, stair count, door width and resting points where professionally verified.
- Add text-only directions, larger-text mode and screen-reader-specific route lists.
- Include load-shedding/service-status indicators for ICT labs, ATMs and library services when a reliable data owner exists.
