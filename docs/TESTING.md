# Testing checklist

Record the phone model, OS/browser, app version, date, network and result for every field test. Use verified campus data for a real pilot.

## Automated checks

- [ ] `npm test` passes all routing, closure, accessibility, search and timetable tests
- [ ] `npm run check:data` passes with no duplicate IDs or disconnected `nearestNode` values
- [ ] `npm run build` completes without errors
- [ ] No secrets, passwords, live admin data or uploaded private photos are committed

## GPS and starting points

- [ ] Allow GPS outdoors: blue “you are here” dot and accuracy circle appear
- [ ] Start a route from GPS; first route segment begins near the reported position
- [ ] Move around campus and confirm the watched location updates without freezing the map
- [ ] Deny permission: clear explanation appears and any building can still be chosen as start
- [ ] Disable device location: timeout/unavailable message is useful and route does not crash
- [ ] Test indoors where accuracy is poor; never imply the blue dot is more precise than its accuracy radius
- [ ] Test GPS far from campus; staff can correct the starting point manually
- [ ] GPS works on the HTTPS production URL, not only localhost

## Routes and accessibility

- [ ] Main Gate → Library follows paths, not a straight line
- [ ] Library → Computer Labs detours around the demonstration closed shortcut
- [ ] Reopen the path in admin and confirm the route updates
- [ ] Enable step-free routing and verify no `accessible: false` segment is used
- [ ] Test a route with no available accessible connection; the explanation is helpful
- [ ] Distance and time are plausible and recalculate when origin/destination changes
- [ ] Turn instructions have the correct left/right direction at real junctions
- [ ] Origin and destination connectors do not route through walls; adjust entrance/node data if they do
- [ ] Walk every published route on site before student release

## Search and building details

- [ ] Search `Library`, `LH 3`, `B12`, `Registrar`, `Computer Lab`, and `BIT 201`
- [ ] Autocomplete distinguishes a building result from a room result
- [ ] Selecting a course/room opens the correct building and expands the correct room
- [ ] Floor, wing and indoor hints match reality; ground floor displays correctly
- [ ] Category filters include Academic, Hostels, Food, Services, Sports and Emergency
- [ ] Navigate button works from every location detail sheet
- [ ] Photo failure still leaves the location name and Navigate button usable

## Timetable and personal data

- [ ] Add, edit and delete a class for every day of the week
- [ ] Next class selects today, tomorrow and the following week correctly
- [ ] Navigate from next class opens the correct building
- [ ] Reload and confirm timetable/favorites/recents/settings persist
- [ ] Test reminders at 10 minutes before class with the app open
- [ ] Denying notification permission does not prevent timetable use
- [ ] Clearing browser site data resets local data as expected
- [ ] Personal timetable and GPS coordinates are not sent to the admin API

## Offline and unstable networks

Test a production build (`npm run build && npm start`) because the worker is disabled during development.

- [ ] First online visit caches the shell, campus data and illustrations
- [ ] In More, download the campus offline area and wait for it to finish before airplane mode
- [ ] Enable airplane mode, close and reload the installed app
- [ ] Search, building details, route calculation, timetable, favorites and dark mode still work
- [ ] Cached tiles appear where available; local vector campus/paths remain when tiles are absent
- [ ] Live admin edits correctly require a connection
- [ ] Return online and confirm fresh campus data replaces the old snapshot
- [ ] Simulate Slow 3G, high latency and intermittent requests; no blank screen or unbounded spinner
- [ ] Test storage full/disabled; personal features degrade without crashing
- [ ] Test an update from an older service-worker cache version

## Device, usability and accessibility

- [ ] Low-end Android with limited memory: map panning and search remain responsive
- [ ] Small 320px-wide screen through large desktop: no blocked Navigate buttons
- [ ] iPhone Safari and Android Chrome installation and safe-area padding
- [ ] Portrait and landscape behavior; map controls remain reachable
- [ ] All touch targets are large enough and bottom navigation has five clear labels
- [ ] Keyboard-only navigation, visible focus, sheet close and form submission
- [ ] Screen-reader labels for icon-only buttons and meaningful building image alternatives
- [ ] Text contrast and controls remain readable in dark mode
- [ ] 200% browser zoom does not hide essential content
- [ ] Reduced-motion preference disables nonessential animation

## Admin and security

- [ ] Wrong password and repeated attempts are rejected; expired session returns to login
- [ ] Add/edit/delete every location type, including coordinates, hours and facilities
- [ ] Add/edit/delete rooms with course codes, floor/wing and accessible hints
- [ ] Upload valid JPG/PNG/WebP; reject invalid type and files over 3 MB
- [ ] Mark closures and publish/edit/hide/delete announcements
- [ ] Import invalid JSON/GeoJSON fails without destroying the current dataset
- [ ] Export backup includes current features and announcements
- [ ] Admin responses and bearer tokens are not stored in the service-worker cache
- [ ] Production uses a strong `ADMIN_PASSWORD` and HTTPS
- [ ] Free/ephemeral hosting limitations are understood and backups exist

## Safety sign-off

- [ ] All emergency numbers are real, answered and approved
- [ ] No placeholder coordinate/hours/contact is presented as verified
- [ ] Accessibility is field-verified with users, not inferred from a map
- [ ] Students are told to follow campus signs and official emergency instructions
- [ ] A staff owner can quickly publish closures and corrections
