import { useCallback, useEffect, useState } from 'react';
import {
  MapPin, LockKeyhole, LogOut, Building2, DoorOpen, Route, Megaphone, Database,
  Plus, Pencil, Trash2, X, Upload, Download, Check, AlertTriangle, LoaderCircle,
  Eye, EyeOff, ArrowLeft, Save, ShieldCheck, Menu,
} from 'lucide-react';
import { locationsFrom, pathsFrom } from '../lib/routing';
import { CATEGORY_META } from '../lib/format';

const blankLocation = { name: '', shortName: '', type: 'Academic building', category: 'academic', description: '', longitude: '34.0072', latitude: '-11.4378', nearestNode: 'n-central', openingHours: 'Mon–Fri, 07:30–16:30', floors: '1', facilities: '', photo: '/images/admin.svg' };
const blankRoom = { name: '', floor: '0', wing: '', courses: '', keywords: '', indoorHint: '', accessibleHint: '' };

async function api(url, options = {}, token) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function AdminBrand() {
  return <div className="admin-brand"><span><MapPin size={23} fill="currentColor" /></span><div><strong>MZUNI</strong><small>CAMPUS ADMIN</small></div></div>;
}

export default function AdminDashboard() {
  const [token, setToken] = useState(() => sessionStorage.getItem('mzuni-admin-token') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [campus, setCampus] = useState(null);
  const [tab, setTab] = useState('locations');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [locationForm, setLocationForm] = useState(null);
  const [roomForm, setRoomForm] = useState(null);
  const [roomLocationId, setRoomLocationId] = useState('library');
  const [announcementForm, setAnnouncementForm] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const refresh = useCallback(async (authToken = token) => {
    const data = await api('/api/admin/campus', {}, authToken);
    setCampus(data);
    if (!locationsFrom(data).some((item) => item.id === roomLocationId)) setRoomLocationId(locationsFrom(data)[0]?.id || '');
  }, [token, roomLocationId]);

  useEffect(() => { if (token) refresh().catch((err) => { setError(err.message); if (err.message.includes('401')) setToken(''); }); }, []); // initial session restore

  const login = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
      sessionStorage.setItem('mzuni-admin-token', result.token); setToken(result.token); setPassword(''); await refresh(result.token);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const run = async (action, message) => {
    setBusy(true); setError('');
    try { await action(); await refresh(); setNotice(message); setTimeout(() => setNotice(''), 3500); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (!token) return (
    <div className="admin-login-page">
      <a href="/" className="admin-back-link"><ArrowLeft size={18} /> Back to campus map</a>
      <div className="admin-login-art"><AdminBrand /><div><span className="eyebrow">FOR UNIVERSITY STAFF</span><h1>Keep campus information<br />helpful and up to date.</h1><p>Manage the places, rooms and routes students depend on — all from one simple dashboard.</p><div className="admin-art-points"><span><Check /> Verify places and opening hours</span><span><Check /> Mark closures and construction</span><span><Check /> Publish campus announcements</span></div></div><small>Demonstration system · secure your password before deployment</small></div>
      <main className="admin-login-form-wrap"><form onSubmit={login} className="admin-login-form"><span className="login-lock"><LockKeyhole size={28} /></span><h2>Welcome back</h2><p>Enter the staff password to manage campus data.</p>{error && <div className="form-error"><AlertTriangle size={17} />{error}</div>}<label>Admin password<div className="password-input"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus placeholder="Enter password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={19} /> : <LockKeyhole size={19} />} Sign in to dashboard</button><div className="login-help"><ShieldCheck size={18} /><span>For local setup, the default is <code>mzuni-admin</code>. Change <code>ADMIN_PASSWORD</code> before deployment.</span></div></form></main>
    </div>
  );

  const locations = locationsFrom(campus);
  const paths = pathsFrom(campus);
  const selectedRoomLocation = locations.find((location) => location.id === roomLocationId);

  const saveLocation = async (event, uploadFile) => {
    event.preventDefault();
    let photo = locationForm.photo;
    if (uploadFile) {
      try {
        const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(uploadFile); });
        const uploaded = await api('/api/admin/upload', { method: 'POST', body: JSON.stringify({ filename: uploadFile.name, data }) }, token);
        photo = uploaded.url;
      } catch (err) {
        setError(`Photo upload failed: ${err.message}`);
        return;
      }
    }
    const id = locationForm.id;
    const body = { ...locationForm, floors: Number(locationForm.floors), facilities: locationForm.facilities.split(',').map((item) => item.trim()).filter(Boolean) };
    await run(async () => { await api(id ? `/api/admin/locations/${id}` : '/api/admin/locations', { method: id ? 'PUT' : 'POST', body: JSON.stringify({ ...body, photo }) }, token); setLocationForm(null); }, id ? 'Place updated' : 'New place added');
  };

  const saveRoom = async (event) => {
    event.preventDefault();
    const body = { ...roomForm, floor: Number(roomForm.floor), courses: roomForm.courses.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean), keywords: roomForm.keywords.split(',').map((item) => item.trim()).filter(Boolean) };
    const locationId = roomForm.locationId;
    const roomId = roomForm.id;
    await run(async () => { await api(roomId ? `/api/admin/locations/${locationId}/rooms/${roomId}` : `/api/admin/locations/${locationId}/rooms`, { method: roomId ? 'PUT' : 'POST', body: JSON.stringify(body) }, token); setRoomForm(null); }, roomId ? 'Room updated' : 'Room added');
  };

  const tabs = [
    { id: 'locations', label: 'Places', icon: Building2, count: locations.length },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen },
    { id: 'closures', label: 'Paths & closures', icon: Route, count: paths.filter((path) => path.properties.closed).length },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, count: campus?.announcements?.length || 0 },
    { id: 'data', label: 'Import & export', icon: Database },
  ];

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileMenu ? 'mobile-open' : ''}`}><AdminBrand /><button className="admin-mobile-close" onClick={() => setMobileMenu(false)}><X /></button><nav>{tabs.map(({ id, label, icon: Icon, count }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setMobileMenu(false); }}><Icon size={20} />{label}{count !== undefined && <span>{count}</span>}</button>)}</nav><div className="admin-sidebar-bottom"><a href="/"><ArrowLeft size={18} /> View student app</a><button onClick={() => { sessionStorage.removeItem('mzuni-admin-token'); setToken(''); setCampus(null); }}><LogOut size={18} /> Sign out</button></div></aside>
      <main className="admin-main">
        <header className="admin-topbar"><button className="admin-menu-button" onClick={() => setMobileMenu(true)}><Menu /></button><div><span className="eyebrow">CAMPUS CONTENT</span><h1>{tabs.find((item) => item.id === tab)?.label}</h1></div><div className="admin-user"><span>MU</span><div><strong>Campus administrator</strong><small>University staff</small></div></div></header>
        <div className="admin-content">
          <div className="admin-verification-banner"><AlertTriangle size={20} /><div><strong>Demonstration data — verification required</strong><p>Every coordinate, room, opening hour and contact must be checked on site before publishing to students.</p></div></div>
          {error && <div className="form-error"><AlertTriangle size={17} />{error}<button onClick={() => setError('')}><X size={16} /></button></div>}
          {notice && <div className="admin-notice"><Check size={17} />{notice}</div>}

          {tab === 'locations' && <section><div className="admin-section-toolbar"><div><h2>Buildings & points of interest</h2><p>Add or update the places shown on the student map.</p></div><button className="button button-primary" onClick={() => setLocationForm({ ...blankLocation })}><Plus size={18} /> Add place</button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Place</th><th>Category</th><th>Coordinates</th><th>Hours</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{locations.map((location) => { const p = location.properties; return <tr key={location.id}><td><div className="table-place"><img src={p.photo || '/images/admin.svg'} alt="" /><div><strong>{p.name}</strong><small>{p.type}</small></div></div></td><td><span className={`table-category category-${p.category}`}>{CATEGORY_META[p.category]?.label || p.category}</span></td><td><code>{location.geometry.coordinates[1].toFixed(5)}, {location.geometry.coordinates[0].toFixed(5)}</code></td><td>{p.openingHours}</td><td><span className="unverified-pill">Unverified</span></td><td><div className="table-actions"><button onClick={() => setLocationForm({ ...p, id: location.id, longitude: String(location.geometry.coordinates[0]), latitude: String(location.geometry.coordinates[1]), facilities: (p.facilities || []).join(', ') })} aria-label={`Edit ${p.name}`}><Pencil size={17} /></button><button className="danger" onClick={() => { if (confirm(`Delete ${p.name}? Its rooms will also be removed.`)) run(() => api(`/api/admin/locations/${location.id}`, { method: 'DELETE' }, token), 'Place deleted'); }}><Trash2 size={17} /></button></div></td></tr>; })}</tbody></table></div></section>}

          {tab === 'rooms' && <section><div className="admin-section-toolbar"><div><h2>Rooms & indoor guidance</h2><p>Help students find the right floor, wing and door.</p></div><button className="button button-primary" disabled={!roomLocationId} onClick={() => setRoomForm({ ...blankRoom, locationId: roomLocationId })}><Plus size={18} /> Add room</button></div><label className="admin-building-picker">Building<select value={roomLocationId} onChange={(event) => setRoomLocationId(event.target.value)}>{locations.map((location) => <option key={location.id} value={location.id}>{location.properties.name}</option>)}</select></label><div className="admin-room-grid">{selectedRoomLocation?.properties.rooms?.map((room) => <article className="admin-room-card" key={room.id}><div><span className="room-icon"><DoorOpen /></span><div><h3>{room.name}</h3><p>{room.floor === 0 ? 'Ground floor' : `Floor ${room.floor}`} · {room.wing || 'Wing not set'}</p></div></div>{room.courses?.length > 0 && <div className="course-tags">{room.courses.join(' · ')}</div>}<p>{room.indoorHint || 'No indoor hint entered.'}</p><footer><button onClick={() => setRoomForm({ ...room, locationId: roomLocationId, courses: (room.courses || []).join(', '), keywords: (room.keywords || []).join(', ') })}><Pencil size={16} /> Edit</button><button className="danger" onClick={() => { if (confirm(`Delete ${room.name}?`)) run(() => api(`/api/admin/locations/${roomLocationId}/rooms/${room.id}`, { method: 'DELETE' }, token), 'Room deleted'); }}><Trash2 size={16} /> Delete</button></footer></article>)}{!selectedRoomLocation?.properties.rooms?.length && <div className="admin-empty"><DoorOpen size={30} /><h3>No rooms in this building</h3><p>Add the first room and its indoor directions.</p></div>}</div></section>}

          {tab === 'closures' && <section><div className="admin-section-toolbar"><div><h2>Walking paths & temporary closures</h2><p>Closed paths are immediately excluded from student routes.</p></div></div><div className="closure-list">{paths.map((path) => <div className={`closure-row ${path.properties.closed ? 'is-closed' : ''}`} key={path.id}><span className="closure-icon"><Route size={21} /></span><div><strong>{path.properties.name}</strong><small>{path.id} · {path.properties.surface} · {path.properties.accessible === false ? 'Not step-free' : 'Step-free'}</small>{path.properties.closed && path.properties.closureReason && <p>{path.properties.closureReason}</p>}</div><label className="switch-with-label"><span>{path.properties.closed ? 'Closed' : 'Open'}</span><input type="checkbox" checked={path.properties.closed} onChange={(event) => run(() => api(`/api/admin/paths/${path.id}`, { method: 'PATCH', body: JSON.stringify({ closed: event.target.checked, closureReason: event.target.checked ? 'Temporary campus closure' : '' }) }, token), `${path.properties.name} marked ${event.target.checked ? 'closed' : 'open'}`)} /><span className="toggle-control" /></label></div>)}</div></section>}

          {tab === 'announcements' && <section><div className="admin-section-toolbar"><div><h2>Campus announcements</h2><p>Publish short, useful updates on the student map.</p></div><button className="button button-primary" onClick={() => setAnnouncementForm({ title: '', message: '', type: 'info', expiresAt: '2027-12-31', active: true })}><Plus size={18} /> New announcement</button></div><div className="announcement-admin-list">{campus?.announcements?.map((item) => <article key={item.id} className={!item.active ? 'inactive' : ''}><span className={`announcement-admin-icon ${item.type}`}><Megaphone size={21} /></span><div><div><h3>{item.title}</h3><span className={item.active ? 'active-pill' : 'inactive-pill'}>{item.active ? 'Active' : 'Hidden'}</span></div><p>{item.message}</p><small>Expires: {item.expiresAt || 'No expiry'}</small></div><div className="table-actions"><button onClick={() => setAnnouncementForm({ ...item })}><Pencil size={17} /></button><button className="danger" onClick={() => { if (confirm('Delete this announcement?')) run(() => api(`/api/admin/announcements/${item.id}`, { method: 'DELETE' }, token), 'Announcement deleted'); }}><Trash2 size={17} /></button></div></article>)}</div></section>}

          {tab === 'data' && <section><div className="admin-section-toolbar"><div><h2>GeoJSON data tools</h2><p>Back up your data or replace placeholder coordinates with a verified file.</p></div></div><div className="data-tool-grid"><article><span><Upload size={27} /></span><h3>Import verified GeoJSON</h3><p>Upload a complete FeatureCollection using the same structure as <code>public/data/campus.geojson</code>. A backup is created first.</p><label className="button button-secondary file-button">Choose GeoJSON file<input type="file" accept=".geojson,.json,application/geo+json" onChange={(event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); if (confirm('Replace current campus data with this file?')) run(() => api('/api/admin/import', { method: 'POST', body: JSON.stringify(data) }, token), 'Verified campus data imported'); } catch { setError('That file is not valid JSON.'); } }; reader.readAsText(file); event.target.value = ''; }} /></label></article><article><span><Download size={27} /></span><h3>Export a backup</h3><p>Download all current places, rooms, paths and settings. Keep a dated copy before making large edits.</p><button className="button button-secondary" onClick={() => { const blob = new Blob([JSON.stringify(campus, null, 2)], { type: 'application/geo+json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `mzuni-campus-${new Date().toISOString().slice(0, 10)}.geojson`; link.click(); URL.revokeObjectURL(link.href); }}>Download GeoJSON</button></article></div><div className="import-guide"><h3>Before importing</h3><ol><li>Collect coordinates on site using GPS, OpenStreetMap or Google Maps.</li><li>Keep coordinates in <b>[longitude, latitude]</b> order.</li><li>Change each feature’s <code>coordinateStatus</code> to <code>VERIFIED ON SITE</code> only after checking it.</li><li>Run <code>npm run check:data</code> locally to validate connections.</li></ol></div></section>}
        </div>
      </main>

      {locationForm && <div className="modal-backdrop"><section className="sheet form-sheet admin-form-sheet"><button className="sheet-close icon-button" onClick={() => setLocationForm(null)}><X /></button><form className="sheet-content app-form" onSubmit={(event) => saveLocation(event, event.currentTarget.elements.photoFile.files[0])}><span className="eyebrow">MAP CONTENT</span><h2>{locationForm.id ? 'Edit place' : 'Add a place'}</h2><div className="form-row"><label>Name<input required value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} /></label><label>Short name<input value={locationForm.shortName} onChange={(e) => setLocationForm({ ...locationForm, shortName: e.target.value })} /></label></div><div className="form-row"><label>Category<select value={locationForm.category} onChange={(e) => setLocationForm({ ...locationForm, category: e.target.value })}>{Object.entries(CATEGORY_META).map(([id, meta]) => <option value={id} key={id}>{meta.label}</option>)}</select></label><label>Type<input required value={locationForm.type} onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })} /></label></div><label>Description<textarea required rows="3" value={locationForm.description} onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })} /></label><div className="form-row"><label>Latitude<input required type="number" step="any" value={locationForm.latitude} onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })} /></label><label>Longitude<input required type="number" step="any" value={locationForm.longitude} onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })} /></label></div><div className="form-row"><label>Nearest path node<input required value={locationForm.nearestNode} onChange={(e) => setLocationForm({ ...locationForm, nearestNode: e.target.value })} /></label><label>Floors<input type="number" min="0" value={locationForm.floors} onChange={(e) => setLocationForm({ ...locationForm, floors: e.target.value })} /></label></div><label>Opening hours<input value={locationForm.openingHours} onChange={(e) => setLocationForm({ ...locationForm, openingHours: e.target.value })} /></label><label>Facilities (comma separated)<input value={locationForm.facilities} onChange={(e) => setLocationForm({ ...locationForm, facilities: e.target.value })} placeholder="Toilets, Ramp, Wi-Fi" /></label><label>Photo (JPG, PNG or WebP, max 3 MB)<input name="photoFile" type="file" accept="image/jpeg,image/png,image/webp" /></label><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setLocationForm(null)}>Cancel</button><button className="button button-primary" disabled={busy}><Save size={18} /> Save place</button></div></form></section></div>}

      {roomForm && <div className="modal-backdrop"><section className="sheet form-sheet admin-form-sheet"><button className="sheet-close icon-button" onClick={() => setRoomForm(null)}><X /></button><form className="sheet-content app-form" onSubmit={saveRoom}><span className="eyebrow">{selectedRoomLocation?.properties.name}</span><h2>{roomForm.id ? 'Edit room' : 'Add a room'}</h2><label>Room or office name<input required value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="e.g. Room B12" /></label><div className="form-row"><label>Floor (0 = ground)<input type="number" min="0" required value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} /></label><label>Wing<input value={roomForm.wing} onChange={(e) => setRoomForm({ ...roomForm, wing: e.target.value })} placeholder="e.g. B wing" /></label></div><label>Course codes (comma separated)<input value={roomForm.courses} onChange={(e) => setRoomForm({ ...roomForm, courses: e.target.value })} placeholder="BIT 201, CSC 210" /></label><label>Search keywords<input value={roomForm.keywords} onChange={(e) => setRoomForm({ ...roomForm, keywords: e.target.value })} /></label><label>Indoor directions<textarea required rows="4" value={roomForm.indoorHint} onChange={(e) => setRoomForm({ ...roomForm, indoorHint: e.target.value })} placeholder="Enter main door, take stairs on the left…" /></label><label>Accessible indoor directions<textarea rows="3" value={roomForm.accessibleHint} onChange={(e) => setRoomForm({ ...roomForm, accessibleHint: e.target.value })} /></label><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setRoomForm(null)}>Cancel</button><button className="button button-primary" disabled={busy}><Save size={18} /> Save room</button></div></form></section></div>}

      {announcementForm && <div className="modal-backdrop"><section className="sheet form-sheet admin-form-sheet"><button className="sheet-close icon-button" onClick={() => setAnnouncementForm(null)}><X /></button><form className="sheet-content app-form" onSubmit={(event) => { event.preventDefault(); const id = announcementForm.id; run(async () => { await api(id ? `/api/admin/announcements/${id}` : '/api/admin/announcements', { method: id ? 'PUT' : 'POST', body: JSON.stringify(announcementForm) }, token); setAnnouncementForm(null); }, 'Announcement saved'); }}><span className="eyebrow">STUDENT MAP UPDATE</span><h2>{announcementForm.id ? 'Edit announcement' : 'New announcement'}</h2><label>Title<input required value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} /></label><label>Message<textarea required rows="4" value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} /></label><div className="form-row"><label>Type<select value={announcementForm.type} onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}><option value="info">Information</option><option value="warning">Warning</option><option value="emergency">Emergency</option></select></label><label>Expiry date<input type="date" value={announcementForm.expiresAt} onChange={(e) => setAnnouncementForm({ ...announcementForm, expiresAt: e.target.value })} /></label></div><label className="toggle-row form-toggle"><span><strong>Show on student map</strong></span><input type="checkbox" checked={announcementForm.active} onChange={(e) => setAnnouncementForm({ ...announcementForm, active: e.target.checked })} /><span className="toggle-control" /></label><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setAnnouncementForm(null)}>Cancel</button><button className="button button-primary" disabled={busy}>Publish update</button></div></form></section></div>}
    </div>
  );
}
