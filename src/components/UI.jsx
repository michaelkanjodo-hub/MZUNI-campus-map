import {
  GraduationCap, BedDouble, Utensils, Landmark, Trophy, HeartPulse, MapPin,
  Navigation, Clock3, ArrowLeft, X, Accessibility, Route, Star, ChevronRight,
} from 'lucide-react';
import { CATEGORY_META } from '../lib/format';

const icons = { GraduationCap, BedDouble, Utensils, Landmark, Trophy, HeartPulse };

export function CategoryIcon({ category, size = 20, ...props }) {
  const Icon = icons[CATEGORY_META[category]?.icon] || MapPin;
  return <Icon size={size} {...props} />;
}

export function CategoryBadge({ category, label }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.services;
  return (
    <span className={`category-badge category-${category}`}>
      <CategoryIcon category={category} size={14} /> {label || meta.label}
    </span>
  );
}

export function EmptyState({ icon: Icon = MapPin, title, children, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={30} /></div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function ViewHeader({ eyebrow, title, subtitle, onBack, action }) {
  return (
    <div className="view-header">
      {onBack && <button className="icon-button" onClick={onBack} aria-label="Go back"><ArrowLeft /></button>}
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LocationRow({ location, room, onClick, favorite, onFavorite, trailing = true }) {
  const p = location.properties;
  return (
    <div className="location-row-wrap">
      <button className="location-row" onClick={onClick}>
        <span className={`location-symbol category-bg-${p.category}`}><CategoryIcon category={p.category} /></span>
        <span className="location-row-copy">
          <strong>{room?.name || p.name}</strong>
          <small>{room ? `${p.name} · ${room.floor === 0 ? 'Ground floor' : `Floor ${room.floor}`}` : `${p.type} · ${p.openingHours?.split('·')[0]}`}</small>
          {room?.courses?.length > 0 && <span className="course-tags">{room.courses.join(' · ')}</span>}
        </span>
        {trailing && <ChevronRight className="row-chevron" size={19} />}
      </button>
      {onFavorite && (
        <button className={`row-favorite ${favorite ? 'is-favorite' : ''}`} onClick={onFavorite} aria-label={`${favorite ? 'Remove' : 'Add'} ${p.name} ${favorite ? 'from' : 'to'} favorites`}>
          <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}

export function ModalShell({ children, onClose, className = '', label }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`sheet ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        <div className="sheet-handle" />
        <button className="sheet-close icon-button" onClick={onClose} aria-label="Close"><X size={22} /></button>
        {children}
      </section>
    </div>
  );
}

export function RouteSummary({ route }) {
  if (!route || route.error) return null;
  return (
    <div className="route-summary-inline">
      <span><Navigation size={16} /> {route.distance >= 1000 ? `${(route.distance / 1000).toFixed(1)} km` : `${route.distance} m`}</span>
      <span><Clock3 size={16} /> {route.durationMinutes} min walk</span>
      {route.accessible && <span><Accessibility size={16} /> Step-free</span>}
    </div>
  );
}

export function PrimaryButton({ children, icon: Icon = Navigation, className = '', ...props }) {
  return <button className={`button button-primary ${className}`} {...props}><Icon size={19} />{children}</button>;
}

export function SafetyNotice() {
  return <div className="data-notice"><Route size={16} /><span>Demonstration map — verify routes on site and follow campus signs.</span></div>;
}
