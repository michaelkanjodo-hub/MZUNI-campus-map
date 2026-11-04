import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getCampus, updateCampus, replaceCampus, uploadDirectory } from './store.js';

try { process.loadEnvFile?.(); } catch { /* .env is optional */ }
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3001);
const adminPassword = process.env.ADMIN_PASSWORD || 'mzuni-admin';
const sessions = new Map();
const loginAttempts = new Map();

app.disable('x-powered-by');
app.use(express.json({ limit: '6mb' }));
app.use((request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (request.path.startsWith('/api/admin')) response.setHeader('Cache-Control', 'no-store');
  next();
});

const safeEqual = (a, b) => {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};
const slugify = (text) => String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || `place-${Date.now()}`;
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max);
const idFor = (prefix) => `${prefix}-${crypto.randomUUID()}`;

function requireAdmin(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return response.status(401).json({ error: 'Your admin session has expired (401). Please sign in again.' });
  }
  session.expires = Date.now() + 8 * 60 * 60 * 1000;
  next();
}

app.get('/api/health', (request, response) => response.json({ ok: true, service: 'MZUNI Campus API', time: new Date().toISOString() }));
app.get('/api/campus', async (request, response, next) => {
  try { response.setHeader('Cache-Control', 'public, max-age=60'); response.json(await getCampus()); } catch (error) { next(error); }
});

app.post('/api/admin/login', (request, response) => {
  const ip = request.ip || 'local';
  const attempt = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
  if (attempt.resetAt < Date.now()) { attempt.count = 0; attempt.resetAt = Date.now() + 15 * 60 * 1000; }
  if (attempt.count >= 10) return response.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
  if (!safeEqual(request.body?.password || '', adminPassword)) {
    attempt.count += 1; loginAttempts.set(ip, attempt);
    return response.status(401).json({ error: 'Incorrect admin password (401).' });
  }
  loginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expires: Date.now() + 8 * 60 * 60 * 1000 });
  response.json({ token, expiresIn: 28800 });
});

app.get('/api/admin/campus', requireAdmin, async (request, response, next) => {
  try { response.json(await getCampus()); } catch (error) { next(error); }
});

function locationProperties(body, existing = {}) {
  const properties = {
    ...existing,
    kind: 'location',
    name: clean(body.name, 120), shortName: clean(body.shortName || body.name, 60), type: clean(body.type, 80),
    category: clean(body.category, 30), description: clean(body.description, 1200), nearestNode: clean(body.nearestNode, 80),
    openingHours: clean(body.openingHours, 250), floors: Math.max(0, Number(body.floors) || 0), photo: clean(body.photo, 500),
    facilities: Array.isArray(body.facilities) ? body.facilities.map((item) => clean(item, 100)).filter(Boolean).slice(0, 30) : [],
    coordinateStatus: 'TO BE VERIFIED ON SITE',
  };
  if (!properties.name || !properties.description) throw new Error('Name and description are required.');
  return properties;
}

app.post('/api/admin/locations', requireAdmin, async (request, response, next) => {
  try {
    const latitude = Number(request.body.latitude), longitude = Number(request.body.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return response.status(400).json({ error: 'Valid latitude and longitude are required.' });
    const result = await updateCampus((campus) => {
      let id = slugify(request.body.name);
      while (campus.features.some((feature) => feature.id === id)) id = `${slugify(request.body.name)}-${crypto.randomInt(100, 999)}`;
      campus.features.push({ type: 'Feature', id, geometry: { type: 'Point', coordinates: [longitude, latitude] }, properties: locationProperties(request.body) });
    });
    response.status(201).json(result);
  } catch (error) { next(error); }
});

app.put('/api/admin/locations/:id', requireAdmin, async (request, response, next) => {
  try {
    let found = false;
    const result = await updateCampus((campus) => {
      const feature = campus.features.find((item) => item.id === request.params.id && item.properties.kind === 'location');
      if (!feature) return;
      found = true;
      const latitude = Number(request.body.latitude), longitude = Number(request.body.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) feature.geometry.coordinates = [longitude, latitude];
      feature.properties = locationProperties(request.body, { rooms: feature.properties.rooms || [], phone: feature.properties.phone, phoneStatus: feature.properties.phoneStatus });
    });
    if (!found) return response.status(404).json({ error: 'Place not found.' });
    response.json(result);
  } catch (error) { next(error); }
});

app.delete('/api/admin/locations/:id', requireAdmin, async (request, response, next) => {
  try {
    const result = await updateCampus((campus) => { campus.features = campus.features.filter((item) => !(item.id === request.params.id && item.properties.kind === 'location')); });
    response.json(result);
  } catch (error) { next(error); }
});

function roomProperties(body) {
  const room = {
    name: clean(body.name, 120), floor: Math.max(0, Number(body.floor) || 0), wing: clean(body.wing, 100),
    courses: Array.isArray(body.courses) ? body.courses.map((item) => clean(item, 30)).filter(Boolean).slice(0, 30) : [],
    keywords: Array.isArray(body.keywords) ? body.keywords.map((item) => clean(item, 80)).filter(Boolean).slice(0, 30) : [],
    indoorHint: clean(body.indoorHint, 1500), accessibleHint: clean(body.accessibleHint, 1500),
  };
  if (!room.name || !room.indoorHint) throw new Error('Room name and indoor directions are required.');
  return room;
}

app.post('/api/admin/locations/:id/rooms', requireAdmin, async (request, response, next) => {
  try {
    let found = false;
    const result = await updateCampus((campus) => {
      const location = campus.features.find((item) => item.id === request.params.id && item.properties.kind === 'location');
      if (!location) return;
      found = true; location.properties.rooms ||= [];
      location.properties.rooms.push({ id: idFor('room'), ...roomProperties(request.body) });
    });
    if (!found) return response.status(404).json({ error: 'Building not found.' });
    response.status(201).json(result);
  } catch (error) { next(error); }
});

app.put('/api/admin/locations/:id/rooms/:roomId', requireAdmin, async (request, response, next) => {
  try {
    let found = false;
    const result = await updateCampus((campus) => {
      const location = campus.features.find((item) => item.id === request.params.id && item.properties.kind === 'location');
      const room = location?.properties.rooms?.find((item) => item.id === request.params.roomId);
      if (!room) return;
      found = true; Object.assign(room, roomProperties(request.body));
    });
    if (!found) return response.status(404).json({ error: 'Room not found.' });
    response.json(result);
  } catch (error) { next(error); }
});

app.delete('/api/admin/locations/:id/rooms/:roomId', requireAdmin, async (request, response, next) => {
  try {
    const result = await updateCampus((campus) => {
      const location = campus.features.find((item) => item.id === request.params.id && item.properties.kind === 'location');
      if (location?.properties.rooms) location.properties.rooms = location.properties.rooms.filter((room) => room.id !== request.params.roomId);
    });
    response.json(result);
  } catch (error) { next(error); }
});

app.patch('/api/admin/paths/:id', requireAdmin, async (request, response, next) => {
  try {
    let found = false;
    const result = await updateCampus((campus) => {
      const feature = campus.features.find((item) => item.id === request.params.id && item.properties.kind === 'path');
      if (!feature) return;
      found = true; feature.properties.closed = !!request.body.closed; feature.properties.closureReason = clean(request.body.closureReason, 300);
    });
    if (!found) return response.status(404).json({ error: 'Path not found.' });
    response.json(result);
  } catch (error) { next(error); }
});

app.post('/api/admin/announcements', requireAdmin, async (request, response, next) => {
  try {
    const result = await updateCampus((campus) => {
      campus.announcements ||= [];
      campus.announcements.push({ id: idFor('announcement'), title: clean(request.body.title, 150), message: clean(request.body.message, 600), type: clean(request.body.type, 30), expiresAt: clean(request.body.expiresAt, 20), active: request.body.active !== false });
    });
    response.status(201).json(result);
  } catch (error) { next(error); }
});

app.put('/api/admin/announcements/:id', requireAdmin, async (request, response, next) => {
  try {
    let found = false;
    const result = await updateCampus((campus) => {
      const item = campus.announcements?.find((entry) => entry.id === request.params.id);
      if (!item) return;
      found = true; Object.assign(item, { title: clean(request.body.title, 150), message: clean(request.body.message, 600), type: clean(request.body.type, 30), expiresAt: clean(request.body.expiresAt, 20), active: !!request.body.active });
    });
    if (!found) return response.status(404).json({ error: 'Announcement not found.' });
    response.json(result);
  } catch (error) { next(error); }
});

app.delete('/api/admin/announcements/:id', requireAdmin, async (request, response, next) => {
  try { response.json(await updateCampus((campus) => { campus.announcements = (campus.announcements || []).filter((item) => item.id !== request.params.id); })); } catch (error) { next(error); }
});

app.post('/api/admin/upload', requireAdmin, async (request, response, next) => {
  try {
    const match = String(request.body.data || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return response.status(400).json({ error: 'Upload a JPG, PNG or WebP image.' });
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 3 * 1024 * 1024) return response.status(413).json({ error: 'Photos must be smaller than 3 MB.' });
    await fs.mkdir(uploadDirectory, { recursive: true });
    const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    const filename = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${extension}`;
    await fs.writeFile(path.join(uploadDirectory, filename), buffer);
    response.status(201).json({ url: `/uploads/${filename}` });
  } catch (error) { next(error); }
});

app.post('/api/admin/import', requireAdmin, async (request, response, next) => {
  try { response.json(await replaceCampus(request.body)); } catch (error) { next(error); }
});

app.use('/uploads', express.static(uploadDirectory, { maxAge: '7d', fallthrough: true }));
app.use('/data', express.static(path.join(__dirname, '..', 'public', 'data')));
app.use(express.static(path.join(__dirname, '..', 'dist'), { maxAge: '1h' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// History fallback lets /admin work when it is opened directly or refreshed.
app.use(async (request, response, next) => {
  if (request.method !== 'GET' || request.path.startsWith('/api/')) return next();
  try { await fs.access(path.join(__dirname, '..', 'dist', 'index.html')); response.sendFile(path.join(__dirname, '..', 'dist', 'index.html')); }
  catch { response.status(404).send('The student app has not been built yet. Run npm run dev for development or npm run build for production.'); }
});

app.use((error, request, response, next) => {
  console.error(error);
  response.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: error.message || 'The request could not be completed.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`MZUNI Campus API listening on http://0.0.0.0:${port}`);
  if (!process.env.ADMIN_PASSWORD) console.warn('Development admin password: mzuni-admin (set ADMIN_PASSWORD before deployment)');
});
