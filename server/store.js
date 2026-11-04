import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(__dirname, 'data');
const seedFile = path.join(__dirname, '..', 'public', 'data', 'campus.geojson');
const liveFile = path.join(dataDirectory, 'campus.live.geojson');
const backupFile = path.join(dataDirectory, 'campus.backup.geojson');
let campusCache;
let writeQueue = Promise.resolve();

export function validateCampus(data) {
  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Expected a GeoJSON FeatureCollection.');
  if (data.features.length > 10000) throw new Error('The file contains too many features for this lightweight server.');
  for (const [index, feature] of data.features.entries()) {
    if (feature.type !== 'Feature' || !feature.geometry || !feature.properties) throw new Error(`Feature ${index + 1} is incomplete.`);
    if (!['Point', 'LineString'].includes(feature.geometry.type)) throw new Error(`Feature ${index + 1} must be a Point or LineString.`);
    if (!Array.isArray(feature.geometry.coordinates)) throw new Error(`Feature ${index + 1} has invalid coordinates.`);
    const positions = feature.geometry.type === 'Point' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    if (feature.geometry.type === 'Point' && feature.geometry.coordinates.length !== 2) throw new Error(`Feature ${index + 1} needs one [longitude, latitude] position.`);
    if (feature.geometry.type === 'LineString' && positions.length < 2) throw new Error(`Feature ${index + 1} needs at least two line positions.`);
    for (const position of positions) {
      if (!Array.isArray(position) || position.length !== 2 || !position.every(Number.isFinite)) throw new Error(`Feature ${index + 1} contains a non-numeric coordinate.`);
      if (Math.abs(position[0]) > 180 || Math.abs(position[1]) > 90) throw new Error(`Feature ${index + 1} contains an out-of-range coordinate.`);
    }
    if (!feature.properties.kind || !['location', 'path'].includes(feature.properties.kind)) throw new Error(`Feature ${index + 1} needs kind "location" or "path".`);
  }
  return true;
}

async function loadFromDisk() {
  if (campusCache) return campusCache;
  await fs.mkdir(dataDirectory, { recursive: true });
  let raw;
  try { raw = await fs.readFile(liveFile, 'utf8'); }
  catch { raw = await fs.readFile(seedFile, 'utf8'); }
  campusCache = JSON.parse(raw);
  validateCampus(campusCache);
  return campusCache;
}

async function writeData(data, { backup = false } = {}) {
  validateCampus(data);
  await fs.mkdir(dataDirectory, { recursive: true });
  if (backup) {
    const current = await loadFromDisk();
    await fs.writeFile(backupFile, JSON.stringify(current, null, 2));
  }
  const temporary = `${liveFile}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(data, null, 2));
  await fs.rename(temporary, liveFile);
  campusCache = data;
  campusCache.metadata = { ...campusCache.metadata, updatedAt: new Date().toISOString() };
  return campusCache;
}

export async function getCampus() {
  return structuredClone(await loadFromDisk());
}

// Serialising writes prevents two admin requests from overwriting each other's
// changes. The live and backup JSON files are intentionally excluded from Git.
export function updateCampus(mutator, options) {
  const operation = writeQueue.then(async () => {
    const draft = await getCampus();
    await mutator(draft);
    draft.metadata = { ...draft.metadata, version: (draft.metadata?.version || 0) + 1, updatedAt: new Date().toISOString() };
    return getCampusAfterWrite(await writeData(draft, options));
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function getCampusAfterWrite(data) {
  return structuredClone(data);
}

export async function replaceCampus(data) {
  validateCampus(data);
  return updateCampus((draft) => {
    draft.features = data.features;
    draft.announcements = data.announcements || [];
    draft.metadata = { ...data.metadata, version: draft.metadata?.version || 0 };
    draft.name = data.name || draft.name;
  }, { backup: true });
}

export const uploadDirectory = path.join(dataDirectory, 'uploads');
