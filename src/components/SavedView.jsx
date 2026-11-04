import { useState } from 'react';
import { Star, Clock3, Navigation, Trash2 } from 'lucide-react';
import { getLocation } from '../lib/routing';
import { EmptyState, LocationRow, ViewHeader } from './UI';

export default function SavedView({ campus, favoriteIds, recentIds, onToggleFavorite, onSelect, onClearRecent }) {
  const [tab, setTab] = useState('favorites');
  const ids = tab === 'favorites' ? favoriteIds : recentIds;
  const locations = ids.map((id) => getLocation(campus, id)).filter(Boolean);

  return (
    <div className="page saved-page">
      <ViewHeader eyebrow="Your personal shortlist" title="Saved places" subtitle="Favorites and recent places are kept on this device." />
      <div className="segmented-control">
        <button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}><Star size={18} /> Favorites <span>{favoriteIds.length}</span></button>
        <button className={tab === 'recent' ? 'active' : ''} onClick={() => setTab('recent')}><Clock3 size={18} /> Recent <span>{recentIds.length}</span></button>
      </div>
      {tab === 'recent' && recentIds.length > 0 && <div className="list-toolbar"><span>Most recent first</span><button className="text-button" onClick={onClearRecent}><Trash2 size={15} /> Clear history</button></div>}
      {locations.length ? (
        <div className="location-list elevated-list saved-list">
          {locations.map((location) => <LocationRow key={location.id} location={location} onClick={() => onSelect(location)} favorite={favoriteIds.includes(location.id)} onFavorite={() => onToggleFavorite(location.id)} />)}
        </div>
      ) : (
        <EmptyState icon={tab === 'favorites' ? Star : Clock3} title={tab === 'favorites' ? 'No favorite places yet' : 'No recent places'}>
          {tab === 'favorites' ? 'Tap the star on any building to keep it here for quick, offline access.' : 'Places you open from search or the map will appear here.'}
        </EmptyState>
      )}
      <div className="saved-tip"><Navigation size={20} /><p><strong>Quick tip</strong>Save your hostel, library and most-used lecture halls so they are always one tap away.</p></div>
    </div>
  );
}
