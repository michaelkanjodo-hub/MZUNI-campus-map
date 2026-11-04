import { useEffect, useRef } from 'react';
import {
  Navigation, Star, Clock3, Building2, Check, Phone, Share2, MapPin,
  DoorOpen, Accessibility, ChevronDown, Info,
} from 'lucide-react';
import { CategoryBadge, ModalShell, SafetyNotice } from './UI';
import { floorLabel } from '../lib/format';

export default function LocationSheet({ location, room, favorite, onFavorite, onNavigate, onClose, onToast }) {
  const roomRef = useRef(null);
  const p = location.properties;

  useEffect(() => {
    if (room && roomRef.current) roomRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [room]);

  const share = async () => {
    const url = `${window.location.origin}/?place=${encodeURIComponent(location.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: `Find ${p.name} on MZUNI Campus Companion`, url });
      else {
        await navigator.clipboard.writeText(url);
        onToast('Link copied to clipboard');
      }
    } catch { /* Sharing cancelled by the user. */ }
  };

  return (
    <ModalShell onClose={onClose} className="location-sheet" label={p.name}>
      <div className="location-photo-wrap">
        <img className="location-photo" src={p.photo || '/images/admin.svg'} alt={`Illustration representing ${p.name}`} />
        <div className="photo-overlay"><CategoryBadge category={p.category} label={p.type} /></div>
      </div>
      <div className="sheet-content location-content">
        <div className="location-title-row">
          <div><h2>{p.name}</h2><span className="placeholder-label"><Info size={12} /> Location to be verified on site</span></div>
          <div className="location-actions-small">
            <button className={`icon-button ${favorite ? 'favorite-active' : ''}`} onClick={onFavorite} aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}><Star size={21} fill={favorite ? 'currentColor' : 'none'} /></button>
            <button className="icon-button" onClick={share} aria-label="Share location"><Share2 size={20} /></button>
          </div>
        </div>
        <p className="location-description">{p.description}</p>
        <div className="primary-actions">
          <button className="button button-primary navigate-button" onClick={onNavigate}><Navigation size={20} fill="currentColor" /> Navigate</button>
          {p.phone && <a className="button button-secondary" href={`tel:${p.phone.replace(/\s/g, '')}`}><Phone size={19} /> Call</a>}
        </div>
        {p.phoneStatus && <p className="warning-copy">{p.phoneStatus}</p>}

        <div className="detail-grid">
          <div className="detail-item"><Clock3 size={20} /><div><span>Opening hours</span><strong>{p.openingHours || 'Hours not available'}</strong></div></div>
          <div className="detail-item"><Building2 size={20} /><div><span>Building</span><strong>{p.floors ? `${p.floors} ${p.floors === 1 ? 'floor' : 'floors'}` : 'Outdoor / single-level area'}</strong></div></div>
        </div>

        {p.facilities?.length > 0 && (
          <section className="detail-section">
            <h3>Facilities</h3>
            <div className="facility-list">{p.facilities.map((facility) => <span key={facility}><Check size={14} />{facility}</span>)}</div>
          </section>
        )}

        {p.rooms?.length > 0 && (
          <section className="detail-section rooms-section">
            <div className="section-title-row"><h3>Rooms & offices</h3><span>{p.rooms.length}</span></div>
            <div className="room-list">
              {p.rooms.map((item) => (
                <details key={item.id} ref={room?.id === item.id ? roomRef : null} open={room?.id === item.id} className={room?.id === item.id ? 'highlighted-room' : ''}>
                  <summary>
                    <span className="room-icon"><DoorOpen size={19} /></span>
                    <span><strong>{item.name}</strong><small>{floorLabel(item.floor)}{item.wing ? ` · ${item.wing}` : ''}</small></span>
                    <ChevronDown size={17} />
                  </summary>
                  <div className="room-details">
                    {item.courses?.length > 0 && <div className="course-tags">{item.courses.join(' · ')}</div>}
                    <h4><MapPin size={15} /> How to find it</h4>
                    <p>{item.indoorHint || 'Ask at reception for directions to this room.'}</p>
                    {item.accessibleHint && <p className="accessible-hint"><Accessibility size={16} />{item.accessibleHint}</p>}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
        <SafetyNotice />
      </div>
    </ModalShell>
  );
}
