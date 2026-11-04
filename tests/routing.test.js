import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildGraph, findRoute, getLocation, haversine, locationsFrom, pathsFrom, searchCampus } from '../src/lib/routing.js';
import { getNextClass } from '../src/lib/format.js';

const campus = JSON.parse(await readFile(new URL('../public/data/campus.geojson', import.meta.url), 'utf8'));

test('sample GeoJSON has useful locations and a connected path graph', () => {
  assert.ok(locationsFrom(campus).length >= 20);
  assert.ok(pathsFrom(campus).length >= 15);
  const graph = buildGraph(campus);
  assert.ok(graph.size >= 12);
  for (const location of locationsFrom(campus)) {
    assert.equal(location.properties.coordinateStatus, 'TO BE VERIFIED ON SITE');
    assert.ok(graph.has(location.properties.nearestNode), `${location.id} must join a non-closed path`);
  }
});

test('route follows graph paths and returns useful walking estimates', () => {
  const route = findRoute(campus, getLocation(campus, 'main-gate'), getLocation(campus, 'library'));
  assert.equal(route.error, undefined);
  assert.ok(route.distance > 500 && route.distance < 1200);
  assert.ok(route.durationMinutes >= 10 && route.durationMinutes <= 20);
  assert.ok(route.coordinates.length > 8);
  assert.ok(route.steps.length >= 2);
  assert.equal(route.steps.at(-1).arrival, true);
});

test('closed Science shortcut is excluded from normal routes', () => {
  const route = findRoute(campus, getLocation(campus, 'library'), getLocation(campus, 'computer-lab'));
  assert.equal(route.error, undefined);
  const openRoute = findRoute(campus, getLocation(campus, 'library'), getLocation(campus, 'computer-lab'), { ignoreClosures: true });
  assert.ok(route.distance > openRoute.distance, 'detour around closure should be longer');
});

test('accessible routing excludes paths marked inaccessible', () => {
  const route = findRoute(campus, getLocation(campus, 'library'), getLocation(campus, 'hostel-a'), { accessibleOnly: true });
  assert.equal(route.error, undefined);
  assert.equal(route.accessible, true);
  const graph = buildGraph(campus, { accessibleOnly: true });
  for (const node of graph.values()) for (const edge of node.edges) assert.notEqual(edge.path.properties.accessible, false);
});

test('GPS-like points snap to the nearest graph node', () => {
  const start = { name: 'Test GPS point', coordinates: [34.00325, -11.44175] };
  const route = findRoute(campus, start, getLocation(campus, 'administration'));
  assert.equal(route.startNode, 'n-main');
  assert.deepEqual(route.coordinates[0], start.coordinates);
});

test('search finds rooms, offices and course codes', () => {
  assert.ok(searchCampus(campus, 'LH 3').some((result) => result.location.id === 'lecture-hall-3'));
  assert.ok(searchCampus(campus, 'Registrar').some((result) => result.room?.id === 'registrar'));
  const course = searchCampus(campus, 'BIT 201');
  assert.ok(course.some((result) => result.room?.id === 'lh3-b12'));
  assert.ok(course.length >= 3);
});

test('haversine distance has the expected scale', () => {
  const oneDegreeLatitude = haversine([34, -11], [34, -10]);
  assert.ok(oneDegreeLatitude > 110000 && oneDegreeLatitude < 112000);
});

test('next class wraps into the following week', () => {
  const classes = [{ id: 'one', course: 'BIT 201', day: 0, time: '08:00', duration: 60 }];
  const mondayMorning = new Date('2026-11-02T07:00:00');
  const mondayAfternoon = new Date('2026-11-02T12:00:00');
  assert.equal(getNextClass(classes, mondayMorning).offset, 0);
  assert.equal(getNextClass(classes, mondayAfternoon).offset, 7);
});
