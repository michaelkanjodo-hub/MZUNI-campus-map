import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map, Search, CalendarDays, Star, Menu, MapPin, Navigation, LocateFixed,
  Wifi, WifiOff, X, Clock3, Bell, GraduationCap, ChevronRight, LoaderCircle,
  ArrowRight, Megaphone, CheckCircle2, Compass, Route as RouteIcon,
} from 'lucide-react';
import CampusMap from './components/CampusMap';
import SearchView from './components/SearchView';
import TimetableView from './components/TimetableView';
import SavedView from './components/SavedView';
import MoreView from './components/MoreView';
import LocationSheet from './components/LocationSheet';
import NavigationPanel from './components/NavigationPanel';
import { CategoryIcon } from './components/UI';
import { loadCampus } from './lib/data';
import { findRoute, getLocation, locationsFrom } from './lib/routing';
import { CATEGORY_META, getNextClass, nextClassLabel } from './lib/format';
import { useLocalStorage } from './hooks/useLocalStorage';
import { saveCampusSnapshot } from './lib/storage';

const NAV_ITEMS = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'saved', label: 'Saved', icon: Star },
  { id: 'more', label: 'More', icon: Menu },
];

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><span className="brand-mark"><MapPin size={22} fill="currentColor" /><span /></span><div><strong>MZUNI</strong>{!compact && <small>CAMPUS COMPANION</small>}</div></div>;
}

export default function App() {
  const initialView = new URLSearchParams(window.location.search).get('view');
  const [view, setView] = useState(NAV_ITEMS.some((item) => item.id === initialView) ? initialView : 'map');
  const [campus, setCampus] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [dataSource, setDataSource] = useState('bundled');
  const [online, setOnline] = useState(navigator.onLine);
  const [selected, setSelected] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [navigation, setNavigation] = useState(null);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState('');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [favorites, setFavorites] = useLocalStorage('mzuni-favorites', []);
  const [recent, setRecent] = useLocalStorage('mzuni-recent', []);
  const [classes, setClasses] = useLocalStorage('mzuni-timetable', []);
  const [darkMode, setDarkMode] = useLocalStorage('mzuni-dark-mode', false);
  const [accessibleDefault, setAccessibleDefault] = useLocalStorage('mzuni-accessible-routes', false);
  const watchId = useRef(null);
  const toastTimer = useRef(null);
  const notified = useRef(new Set());

  const showToast = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4200);
  };

  useEffect(() => {
    let active = true;
    loadCampus().then((result) => {
      if (!active) return;
      setCampus(result.campus);
      setDataSource(result.source);
    }).catch((error) => active && setLoadError(error.message));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const captureInstall = (event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('beforeinstallprompt', captureInstall);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener('beforeinstallprompt', captureInstall);
      if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
      clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#10231f' : '#075b50');
  }, [darkMode]);

  useEffect(() => {
    if (!campus) return;
    const placeId = new URLSearchParams(window.location.search).get('place');
    if (placeId) {
      const location = getLocation(campus, placeId);
      if (location) { setSelected(location); setView('map'); }
    }
  }, [campus]);

  const nextClass = useMemo(() => getNextClass(classes), [classes, nowTick]);
  const locations = useMemo(() => locationsFrom(campus), [campus]);
  const destination = navigation ? getLocation(campus, navigation.destinationId) : null;
  const originLocation = navigation?.origin === 'gps'
    ? (userLocation ? { name: 'My current location', coordinates: [userLocation.longitude, userLocation.latitude] } : null)
    : getLocation(campus, navigation?.origin);
  const route = useMemo(() => {
    if (!campus || !navigation || !destination || !originLocation) return null;
    return findRoute(campus, originLocation, destination, { accessibleOnly: navigation.accessible });
  }, [campus, navigation, destination, originLocation, userLocation]);

  useEffect(() => {
    const clock = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const upcoming = getNextClass(classes);
      if (!upcoming?.reminder) return;
      const minutesAway = Math.round((upcoming.date - new Date()) / 60000);
      const key = `${upcoming.id}-${upcoming.date.toISOString()}`;
      if (minutesAway >= 0 && minutesAway <= 10 && !notified.current.has(key)) {
        try {
          new Notification(`Class in ${minutesAway || 'a few'} minutes`, { body: `${upcoming.course} · ${upcoming.room} at ${upcoming.time}`, icon: '/icons/icon-192.png', tag: key });
          notified.current.add(key);
        } catch { /* Some installed mobile browsers only support service-worker notifications. */ }
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [classes]);

  const selectLocation = (location, room = null) => {
    if (!location) return;
    setSelected(location);
    setSelectedRoom(room);
    setNavigation(null);
    setDirectionsOpen(false);
    setRecent((ids) => [location.id, ...ids.filter((id) => id !== location.id)].slice(0, 10));
  };

  const startNavigation = (location) => {
    if (!location) { showToast('This class needs a campus building before directions can be shown.'); return; }
    setSelected(null);
    setSelectedRoom(null);
    setView('map');
    setNavigation({ destinationId: location.id, origin: userLocation ? 'gps' : 'main-gate', accessible: accessibleDefault });
    setDirectionsOpen(true);
  };

  const locateUser = () => {
    if (!navigator.geolocation) { showToast('GPS is not supported on this device. Choose a starting point instead.'); return; }
    setLocating(true);
    const success = (position) => {
      setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
      setLocating(false);
    };
    navigator.geolocation.getCurrentPosition(success, (error) => {
      setLocating(false);
      const messages = { 1: 'Location permission was declined. Choose a starting point instead.', 2: 'Your position is unavailable. Move outdoors and try again.', 3: 'GPS took too long. Move to an open area and try again.' };
      showToast(messages[error.code] || 'Could not find your location.');
      if (navigation?.origin === 'gps') setNavigation({ ...navigation, origin: 'main-gate' });
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 });
    if (watchId.current === null) watchId.current = navigator.geolocation.watchPosition(success, () => {}, { enableHighAccuracy: true, maximumAge: 20000, timeout: 20000 });
  };

  const toggleFavorite = (id) => {
    setFavorites((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
    showToast(favorites.includes(id) ? 'Removed from favorites' : 'Saved to favorites');
  };

  const downloadOffline = async () => {
    if (campus) await saveCampusSnapshot(campus);
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'CACHE_CAMPUS', zooms: [15, 16, 17] });
    }
  };

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') showToast('MZUNI Campus is being installed');
      setInstallPrompt(null);
    } else {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      showToast(ios ? 'On iPhone: tap Share, then “Add to Home Screen”.' : 'Open your browser menu and choose “Install app” or “Add to Home screen”.');
    }
  };

  const activeAnnouncement = campus?.announcements?.find((item) => item.active && (!item.expiresAt || new Date(item.expiresAt) > new Date()));
  const emergencyLocations = ['clinic', 'security'].map((id) => getLocation(campus, id)).filter(Boolean);

  if (loadError) return <div className="startup-screen"><Brand /><div className="startup-error"><WifiOff size={34} /><h1>Campus data unavailable</h1><p>{loadError}</p><button className="button button-primary" onClick={() => window.location.reload()}>Try again</button></div></div>;
  if (!campus) return <div className="startup-screen"><Brand /><div className="startup-loader"><span className="logo-pulse"><Compass size={35} /></span><h1>Finding your way…</h1><p>Loading campus places and walking paths</p><LoaderCircle className="spin" /></div></div>;

  return (
    <div className={`app-shell view-${view}`}>
      <aside className="desktop-sidebar">
        <Brand />
        <nav className="side-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={21} /><span>{label}</span>{id === 'saved' && favorites.length > 0 && <small>{favorites.length}</small>}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        {nextClass ? <div className="sidebar-next-class"><span className="eyebrow"><span className="live-dot" /> NEXT CLASS</span><strong>{nextClass.course}</strong><p>{nextClass.room}</p><small><Clock3 size={14} />{nextClassLabel(nextClass)}</small><button onClick={() => startNavigation(getLocation(campus, nextClass.locationId))}>Navigate <ArrowRight size={16} /></button></div> : <div className="sidebar-next-class empty"><GraduationCap size={26} /><strong>Plan your week</strong><p>Add classes for one-tap directions.</p><button onClick={() => setView('timetable')}>Open timetable <ArrowRight size={16} /></button></div>}
        <div className="sidebar-status"><span className={online ? 'status-online' : 'status-offline'}>{online ? <Wifi size={15} /> : <WifiOff size={15} />}</span><div><strong>{online ? 'Online' : 'Offline mode'}</strong><small>{online ? 'Campus data is up to date' : 'Saved campus data active'}</small></div></div>
      </aside>

      <main className="app-main">
        {view === 'map' ? (
          <section className="map-view">
            <CampusMap campus={campus} selectedId={selected?.id || navigation?.destinationId} activeCategory={activeCategory} route={route} userLocation={userLocation} onSelect={selectLocation} />
            <div className="map-top-overlay">
              <div className="mobile-map-brand"><Brand /><button className={`connection-pill ${online ? '' : 'offline'}`} onClick={() => showToast(online ? 'You are online. Campus data is saved for offline use.' : 'Offline mode: search, saved places and campus routes still work.')}>{online ? <Wifi size={14} /> : <WifiOff size={14} />}{online ? 'Online' : 'Offline'}</button></div>
              <button className="map-search-bar" onClick={() => setView('search')}><Search size={21} /><span>Where do you want to go?</span><kbd>Search</kbd></button>
              <div className="category-scroller" aria-label="Filter map by category">
                <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}><MapPin size={16} /> All places</button>
                {Object.entries(CATEGORY_META).map(([id, meta]) => <button key={id} className={activeCategory === id ? 'active' : ''} onClick={() => setActiveCategory(activeCategory === id ? 'all' : id)}><CategoryIcon category={id} size={16} />{meta.label}</button>)}
              </div>
              {activeAnnouncement && !announcementDismissed && <div className={`map-announcement ${activeAnnouncement.type}`}><Megaphone size={17} /><span><strong>{activeAnnouncement.title}</strong>{activeAnnouncement.message}</span><button onClick={() => setAnnouncementDismissed(true)} aria-label="Dismiss announcement"><X size={16} /></button></div>}
            </div>

            <div className="map-floating-controls">
              <button className={`map-control-button ${locating ? 'locating' : ''}`} onClick={locateUser} aria-label="Show my GPS location" title="My location">{locating ? <LoaderCircle className="spin" size={22} /> : <LocateFixed size={22} />}</button>
            </div>

            {navigation && destination && route && !route.error && !directionsOpen && (
              <div className="active-route-card">
                <div className="route-time-badge"><Navigation size={19} fill="currentColor" /><strong>{route.durationMinutes} min</strong><span>{route.distance >= 1000 ? `${(route.distance / 1000).toFixed(1)} km` : `${route.distance} m`}</span></div>
                <div><small>Walking to</small><strong>{destination.properties.name}</strong></div>
                <button className="icon-button" onClick={() => setDirectionsOpen(true)} aria-label="Show directions"><ChevronRight size={20} /></button>
                <button className="icon-button" onClick={() => setNavigation(null)} aria-label="End route"><X size={19} /></button>
              </div>
            )}

            {!navigation && nextClass && (
              <button className="map-next-class" onClick={() => startNavigation(getLocation(campus, nextClass.locationId))}>
                <span className="next-class-icon"><GraduationCap size={22} /></span><span><small>NEXT · {nextClassLabel(nextClass)}</small><strong>{nextClass.course} <span>·</span> {nextClass.room}</strong></span><span className="mini-nav"><Navigation size={17} fill="currentColor" /></span>
              </button>
            )}
          </section>
        ) : (
          <div className="page-scroll">
            {view === 'search' && <SearchView campus={campus} recentIds={recent} onSelect={selectLocation} onClearRecent={() => setRecent([])} />}
            {view === 'timetable' && <TimetableView campus={campus} classes={classes} setClasses={setClasses} onNavigate={startNavigation} onToast={showToast} />}
            {view === 'saved' && <SavedView campus={campus} favoriteIds={favorites} recentIds={recent} onToggleFavorite={toggleFavorite} onSelect={selectLocation} onClearRecent={() => setRecent([])} />}
            {view === 'more' && <MoreView darkMode={darkMode} setDarkMode={setDarkMode} accessibleDefault={accessibleDefault} setAccessibleDefault={setAccessibleDefault} onInstall={installApp} canInstall={!!installPrompt} onDownloadOffline={downloadOffline} online={online} dataSource={dataSource} emergencyLocations={emergencyLocations} onNavigate={startNavigation} onToast={showToast} />}
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><span className="bottom-icon"><Icon size={22} strokeWidth={view === id ? 2.4 : 1.9} />{id === 'saved' && favorites.length > 0 && <i />}</span><span>{label}</span></button>)}
      </nav>

      {selected && <LocationSheet location={selected} room={selectedRoom} favorite={favorites.includes(selected.id)} onFavorite={() => toggleFavorite(selected.id)} onNavigate={() => startNavigation(selected)} onClose={() => { setSelected(null); setSelectedRoom(null); }} onToast={showToast} />}
      {directionsOpen && navigation && destination && <NavigationPanel campus={campus} destination={destination} origin={navigation.origin} onOriginChange={(origin) => setNavigation({ ...navigation, origin })} userLocation={userLocation} locating={locating} onLocate={locateUser} route={route} accessible={navigation.accessible} onAccessibleChange={(accessible) => setNavigation({ ...navigation, accessible })} onClose={() => { setDirectionsOpen(false); if (route?.error) setNavigation(null); }} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={19} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={16} /></button></div>}
    </div>
  );
}
