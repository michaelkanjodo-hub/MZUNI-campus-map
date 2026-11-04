# Project plan and release sequence

## Phase 1 — verified foundation (this MVP)

1. Confirm university ownership, branding, emergency contacts and a staff data owner.
2. Replace all demonstration coordinates and room information using the fieldwork guide.
3. Test path continuity and accessibility with students who use different mobility aids.
4. Run the automated and on-device testing checklists.
5. Deploy behind HTTPS with a strong admin password and regular GeoJSON backups.

## Phase 2 — small student pilot

- Pilot with a first-year orientation group.
- Measure failed searches, route completion, GPS problems and offline launches.
- Add missing aliases, Chichewa/Tumbuka terms and room names based on real searches.
- Correct routes before adding more visual features.

## Phase 3 — production operations

- Move shared data to PostgreSQL/PostGIS or Supabase.
- Add named staff accounts, role permissions, audit logs and moderation.
- Set up error monitoring, backups, uptime monitoring and OSM-compliant tile capacity.
- Create a termly room/timetable verification process.

## Suggested team responsibilities

| Role | Responsibility |
| --- | --- |
| University product owner | Priorities, student safety, launch approval |
| Campus data editor | Places, rooms, hours, closures, verification dates |
| Student testers | First-year usability and low-end Android tests |
| Accessibility reviewers | Step-free field checks and indoor guidance |
| Developer | Releases, backups, API/database and privacy |

## Definition of “ready for real students”

- No active feature still marked `TO BE VERIFIED ON SITE`.
- Security and clinic numbers tested by university staff.
- Every public route walked and checked for closures and hazards.
- No inaccessible path presented as step-free.
- Offline reload verified on actual phones, not only a desktop emulator.
- A documented owner responds to closures and incorrect room reports.
