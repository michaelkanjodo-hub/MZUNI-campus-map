import { readFile } from 'node:fs/promises';
import { buildGraph, locationsFrom, pathsFrom } from '../src/lib/routing.js';

const file = process.argv[2] || 'public/data/campus.geojson';
const campus = JSON.parse(await readFile(file, 'utf8'));
const errors = [];
const ids = new Set();

if (campus.type !== 'FeatureCollection') errors.push('Root must be a GeoJSON FeatureCollection.');
for (const feature of campus.features || []) {
  if (!feature.id) errors.push('Every feature needs a unique id.');
  if (ids.has(feature.id)) errors.push(`Duplicate feature id: ${feature.id}`);
  ids.add(feature.id);
  if (feature.properties?.coordinateStatus !== 'TO BE VERIFIED ON SITE' && file.includes('public/data')) {
    errors.push(`${feature.id}: demonstration coordinates must remain marked TO BE VERIFIED ON SITE.`);
  }
  if (feature.geometry?.type === 'Point') {
    const [longitude, latitude] = feature.geometry.coordinates;
    if (longitude < 33.9 || longitude > 34.1 || latitude < -11.6 || latitude > -11.3) errors.push(`${feature.id}: point is outside the expected Mzuzu demonstration area.`);
  }
}

const graph = buildGraph(campus);
const nodeCoordinates = new Map();
for (const path of pathsFrom(campus)) {
  const p = path.properties;
  const coordinates = path.geometry.coordinates;
  if (!p.from || !p.to) errors.push(`${path.id}: path needs from and to node ids.`);
  if (coordinates.length < 2) errors.push(`${path.id}: path needs at least two positions.`);
  if (p.closed) continue;
  for (const [node, coordinate] of [[p.from, coordinates[0]], [p.to, coordinates.at(-1)]]) {
    if (nodeCoordinates.has(node) && JSON.stringify(nodeCoordinates.get(node)) !== JSON.stringify(coordinate)) errors.push(`${path.id}: ${node} endpoint does not match its other paths.`);
    nodeCoordinates.set(node, coordinate);
  }
}

for (const location of locationsFrom(campus)) {
  if (!graph.has(location.properties.nearestNode)) errors.push(`${location.id}: nearestNode ${location.properties.nearestNode} is not in the open routing graph.`);
}

if (errors.length) {
  console.error(`\n${errors.length} data problem(s):\n- ${errors.join('\n- ')}\n`);
  process.exit(1);
}
console.log(`✓ ${file} is valid`);
console.log(`  ${locationsFrom(campus).length} locations, ${pathsFrom(campus).length} paths, ${graph.size} open routing nodes`);
console.log(`  Coordinate status: ${campus.metadata?.coordinateStatus || 'check individual features'}`);
