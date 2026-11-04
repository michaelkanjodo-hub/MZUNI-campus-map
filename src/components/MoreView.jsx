import {
  Moon, Sun, Download, Smartphone, ShieldCheck, HeartPulse, Phone, Navigation,
  Accessibility, ChevronRight, Languages, Database, CircleHelp, ExternalLink,
  WifiOff, CheckCircle2, Info, LockKeyhole, MapPinned,
} from 'lucide-react';
import { availableLanguages } from '../i18n';
import { ViewHeader } from './UI';

export default function MoreView({ darkMode, setDarkMode, accessibleDefault, setAccessibleDefault, onInstall, canInstall, onDownloadOffline, online, dataSource, emergencyLocations, onNavigate, onToast }) {
  const cacheOffline = async () => {
    await onDownloadOffline();
    onToast(online ? 'Campus data and map tiles are being saved for offline use' : 'Core campus data is already available offline');
  };

  return (
    <div className="page more-page">
      <ViewHeader eyebrow="Make campus feel familiar" title="More & settings" subtitle="Safety, offline access, accessibility and app information." />

      <section className="emergency-card">
        <div className="emergency-heading"><span><ShieldCheck size={25} /></span><div><h2>Emergency & safety</h2><p>Quick access to campus assistance</p></div></div>
        {emergencyLocations.map((location) => (
          <div className="emergency-contact" key={location.id}>
            <span className="emergency-type">{location.id === 'clinic' ? <HeartPulse size={21} /> : <ShieldCheck size={21} />}</span>
            <div><strong>{location.properties.name}</strong><small>{location.properties.openingHours}</small></div>
            <a href={`tel:${location.properties.phone.replace(/\s/g, '')}`} aria-label={`Call ${location.properties.name}`}><Phone size={19} /></a>
            <button onClick={() => onNavigate(location)} aria-label={`Navigate to ${location.properties.name}`}><Navigation size={19} /></button>
          </div>
        ))}
        <p className="emergency-disclaimer"><Info size={14} /> All contact numbers are placeholders. University staff must verify them before public release.</p>
      </section>

      <section className="settings-section">
        <h2>App preferences</h2>
        <div className="settings-card">
          <div className="setting-row"><span className="setting-icon">{darkMode ? <Moon size={21} /> : <Sun size={21} />}</span><div><strong>Dark mode</strong><small>Easier on your eyes at night</small></div><label className="switch-only"><input type="checkbox" checked={darkMode} onChange={(event) => setDarkMode(event.target.checked)} aria-label="Dark mode" /><span className="toggle-control" /></label></div>
          <div className="setting-row"><span className="setting-icon"><Accessibility size={21} /></span><div><strong>Prefer step-free routes</strong><small>Use accessible paths by default</small></div><label className="switch-only"><input type="checkbox" checked={accessibleDefault} onChange={(event) => setAccessibleDefault(event.target.checked)} aria-label="Prefer step-free routes" /><span className="toggle-control" /></label></div>
          <button className="setting-row setting-button" onClick={() => onToast('Chichewa and Tumbuka translations are planned. English is active in this version.')}><span className="setting-icon"><Languages size={21} /></span><div><strong>Language</strong><small>English · Chichewa and Tumbuka ready to add</small></div><ChevronRight size={19} /></button>
        </div>
      </section>

      <section className="settings-section">
        <h2>Offline & installation</h2>
        <div className="settings-card">
          <button className="setting-row setting-button" onClick={cacheOffline}><span className="setting-icon"><Download size={21} /></span><div><strong>Download campus for offline use</strong><small>Places, routes and a small area of map tiles</small></div><ChevronRight size={19} /></button>
          <button className="setting-row setting-button" onClick={onInstall}><span className="setting-icon"><Smartphone size={21} /></span><div><strong>Install on this phone</strong><small>{canInstall ? 'Add the app to your home screen' : 'Open installation instructions'}</small></div><ChevronRight size={19} /></button>
          <div className="setting-row"><span className="setting-icon">{online ? <CheckCircle2 size={21} /> : <WifiOff size={21} />}</span><div><strong>{online ? 'Ready for unreliable connections' : 'You are offline — core features still work'}</strong><small>Data source: {dataSource === 'server' ? 'Live campus data' : dataSource === 'offline' ? 'Saved device snapshot' : 'Bundled campus data'}</small></div></div>
        </div>
      </section>

      <section className="settings-section">
        <h2>About & support</h2>
        <div className="settings-card">
          <details className="setting-details"><summary><span className="setting-icon"><CircleHelp size={21} /></span><div><strong>How to use the app</strong><small>Search, navigate and plan your classes</small></div><ChevronRight size={18} /></summary><ol><li>Search a building, room or course code.</li><li>Tap <b>Navigate</b> and choose your starting point.</li><li>Follow the green route and walking steps.</li><li>Add classes to your timetable for one-tap directions.</li></ol></details>
          <details className="setting-details"><summary><span className="setting-icon"><MapPinned size={21} /></span><div><strong>About this demonstration map</strong><small>Placeholder data — verification required</small></div><ChevronRight size={18} /></summary><p>Every coordinate, room allocation, opening hour and phone number in this starter project must be checked on site. Do not rely on the sample data for emergencies or accessibility decisions.</p></details>
          <a className="setting-row setting-button" href="/admin"><span className="setting-icon"><LockKeyhole size={21} /></span><div><strong>University staff admin</strong><small>Manage places, closures and announcements</small></div><ExternalLink size={17} /></a>
          <a className="setting-row setting-button" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"><span className="setting-icon"><Database size={21} /></span><div><strong>Open data & privacy</strong><small>OpenStreetMap contributors · personal data stays local</small></div><ExternalLink size={17} /></a>
        </div>
      </section>
      <footer className="app-footer"><span className="mini-brand"><MapPinned size={20} /></span><strong>MZUNI Campus Companion</strong><p>Version 1.0 · Built for students, by the campus community.</p></footer>
    </div>
  );
}
