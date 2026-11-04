import {
  Navigation, MapPin, LocateFixed, ArrowUp, CornerUpRight, CornerUpLeft,
  Flag, Accessibility, Clock3, Footprints, AlertTriangle, LoaderCircle, X,
} from 'lucide-react';
import { locationsFrom } from '../lib/routing';
import { formatDistance } from '../lib/format';
import { ModalShell, SafetyNotice } from './UI';

function StepIcon({ instruction }) {
  if (instruction.startsWith('Arrive')) return <Flag size={18} />;
  if (instruction.toLowerCase().includes('right')) return <CornerUpRight size={18} />;
  if (instruction.toLowerCase().includes('left')) return <CornerUpLeft size={18} />;
  return <ArrowUp size={18} />;
}

export default function NavigationPanel({ campus, destination, origin, onOriginChange, userLocation, locating, onLocate, route, accessible, onAccessibleChange, onClose }) {
  const locations = locationsFrom(campus);
  const destinationName = destination.properties.name;

  return (
    <ModalShell onClose={onClose} className="navigation-sheet" label={`Directions to ${destinationName}`}>
      <div className="sheet-content navigation-content">
        <span className="eyebrow">Walking directions</span>
        <h2>To {destinationName}</h2>
        <div className="route-endpoints">
          <div className="endpoint-line"><span className="endpoint-dot start-dot" /><span className="endpoint-dashes" /><span className="endpoint-dot end-dot" /></div>
          <div className="endpoint-fields">
            <label>
              <span className="sr-only">Starting point</span>
              <select value={origin} onChange={(event) => onOriginChange(event.target.value)}>
                <option value="gps" disabled={!userLocation}>My current location{!userLocation ? ' (enable GPS)' : ''}</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.properties.name}</option>)}
              </select>
            </label>
            <div className="destination-field"><MapPin size={17} /><strong>{destinationName}</strong></div>
          </div>
          <button className="locate-inline" onClick={() => { onOriginChange('gps'); onLocate(); }} aria-label="Use my current GPS location">
            {locating ? <LoaderCircle className="spin" size={19} /> : <LocateFixed size={19} />}<span>Use GPS</span>
          </button>
        </div>

        <label className="toggle-row accessible-route-toggle">
          <span className="toggle-icon"><Accessibility size={21} /></span>
          <span><strong>Step-free route</strong><small>Avoid paths marked as inaccessible</small></span>
          <input type="checkbox" checked={accessible} onChange={(event) => onAccessibleChange(event.target.checked)} />
          <span className="toggle-control" />
        </label>

        {route?.error ? (
          <div className="route-error"><AlertTriangle size={25} /><div><strong>Route unavailable</strong><p>{route.error}</p></div></div>
        ) : route ? (
          <>
            <div className="route-hero-stats">
              <div><strong>{route.durationMinutes}</strong><span>minutes</span></div>
              <div><strong>{formatDistance(route.distance)}</strong><span>walking distance</span></div>
              <div className="walking-illustration"><Footprints size={34} /></div>
            </div>
            <div className="route-quality"><Clock3 size={15} /> Estimate at {campus.metadata?.walkingSpeedKmh || 4.8} km/h · actual time may vary</div>
            <section className="direction-steps">
              <h3>Step-by-step directions</h3>
              <ol>
                {route.steps.map((step, index) => (
                  <li key={`${step.instruction}-${index}`} className={step.arrival ? 'arrival-step' : ''}>
                    <span className="step-icon"><StepIcon instruction={step.instruction} /></span>
                    <div><strong>{step.instruction}</strong>{step.distance > 0 && <small>{formatDistance(step.distance)}</small>}</div>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : <div className="loading-route"><LoaderCircle className="spin" /> Finding the best path…</div>}
        <SafetyNotice />
      </div>
      <div className="navigation-bottom-bar"><button className="button button-primary" onClick={onClose}><Navigation size={19} /> View route on map</button><button className="icon-button" onClick={onClose} aria-label="Close directions"><X size={20} /></button></div>
    </ModalShell>
  );
}
