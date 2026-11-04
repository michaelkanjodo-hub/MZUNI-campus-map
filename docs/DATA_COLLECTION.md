# Collect and import real campus coordinates

The supplied `public/data/campus.geojson` demonstrates the software only. Every coordinate is marked **TO BE VERIFIED ON SITE**. Replace it through a careful field survey.

## Before you start

- Ask Mzuzu University for permission and an up-to-date campus map.
- Arrange a walking survey with someone who knows the buildings and accessible entrances.
- Charge your phone, enable location, and carry a notebook for floor/wing/hours details.
- Do not photograph people, private rooms or security installations without permission.

## Option A — collect points with a phone GPS

1. Stand at the actual public entrance, outdoors where the phone can see the sky.
2. Open a GPS coordinate app or OpenStreetMap-based recording tool. Wait for accuracy to settle, ideally below 10 metres.
3. Record **latitude** (around `-11.4` in Mzuzu) and **longitude** (around `34.0`).
4. Save the building name, entrance name, accuracy and date. Example:

   ```text
   Library main entrance
   latitude: -11.43630
   longitude: 34.00720
   GPS accuracy: 7 m
   checked: 2026-11-04 by [surveyor]
   ```

5. Repeat at each accessible entrance. A building centroid is not always a safe navigation destination; route students to an entrance.
6. Walk each footpath while recording a GPX trace if possible. Mark stairs, steep ramps, rough surfaces, gates and closures.

## Option B — read coordinates from Google Maps

1. Open Google Maps and zoom to the entrance.
2. Long-press the entrance on a phone, or right-click it on a computer.
3. Copy the displayed coordinates. Google normally displays **latitude, longitude**.
4. When adding them to GeoJSON, reverse the order to **[longitude, latitude]**.
5. Use coordinates as a survey aid, then confirm them on site. Do not copy proprietary map geometry into OpenStreetMap.

## Option C — improve OpenStreetMap first

1. Create a free OpenStreetMap account and read its beginner guide.
2. Use the iD editor to trace only features you have verified or are licensed to add.
3. Add buildings, entrances, footways, steps, gates and accessibility tags such as `wheelchair=yes`.
4. Save with a clear changeset comment and sources.
5. Export permitted OSM data using Overpass Turbo or another OSM export tool, then convert the needed features to this project’s schema.
6. Keep OpenStreetMap attribution in the app. Do not bulk-download more tile data than the small campus cache needs.

## Understand the two feature types

### Location (Point)

```json
{
  "type": "Feature",
  "id": "library",
  "geometry": { "type": "Point", "coordinates": [34.0072, -11.4363] },
  "properties": {
    "kind": "location",
    "name": "University Library",
    "shortName": "Library",
    "category": "academic",
    "type": "Library",
    "description": "Main learning resource centre.",
    "nearestNode": "n-library",
    "openingHours": "Mon–Fri, 07:00–22:00",
    "floors": 3,
    "photo": "/images/library.svg",
    "facilities": ["Toilets", "Ramp", "Lift"],
    "rooms": [],
    "coordinateStatus": "VERIFIED ON SITE"
  }
}
```

Allowed categories are `academic`, `hostels`, `food`, `services`, `sports`, and `emergency`.

### Walking path (LineString)

```json
{
  "type": "Feature",
  "id": "path-library-north",
  "geometry": {
    "type": "LineString",
    "coordinates": [[34.0068, -11.4365], [34.0075, -11.4349]]
  },
  "properties": {
    "kind": "path",
    "name": "Library concourse",
    "from": "n-library",
    "to": "n-north",
    "surface": "paved",
    "accessible": true,
    "closed": false,
    "coordinateStatus": "VERIFIED ON SITE"
  }
}
```

### Routing rules that matter

- The first path position belongs to `from`; the last belongs to `to`.
- Paths sharing a node ID must use **exactly the same coordinates** at that junction.
- Each location’s `nearestNode` must exist in an open path.
- Set `accessible: false` for stairs or any segment not verified as step-free.
- Set `closed: true` for construction; the router automatically detours.
- Use intermediate LineString positions to follow bends. Never connect buildings with one straight line across a courtyard or structure.

## Import through the admin dashboard

1. Make a copy of the original file first.
2. Run this local check (replace the filename if yours differs):

   ```bash
   npm run check:data -- path/to/verified-campus.geojson
   ```

3. Start the full app, sign in at `/admin`, and open **Import & export**.
4. Download a backup of the current data.
5. Choose your verified GeoJSON file and confirm replacement.
6. Open the student map and test routes between several gates, lecture rooms and hostels.
7. Correct any disconnected nodes and repeat the validator.

## Update the bundled static fallback

The admin API stores live edits in `server/data/campus.live.geojson`, which is intentionally not committed. Static hosts cannot run that API. After verification, also replace `public/data/campus.geojson` with the approved export so static deployments and first-time offline installs receive the corrected data.

## Survey quality checklist

- [ ] Every public building entrance checked on foot
- [ ] Coordinates recorded in longitude/latitude order
- [ ] Junction coordinates match exactly
- [ ] Routes walked end-to-end
- [ ] Accessibility reviewed with knowledgeable users/staff, not inferred from aerial imagery
- [ ] Floor numbers use `0` for ground floor
- [ ] Indoor hints begin at a named public entrance
- [ ] Opening hours and emergency numbers confirmed with their owners
- [ ] Personal or sensitive information removed from photos/descriptions
- [ ] Verification date and staff reviewer recorded in your operational records
