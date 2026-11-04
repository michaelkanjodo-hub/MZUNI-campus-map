import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Clock3, GraduationCap, Sparkles, ArrowUpRight } from 'lucide-react';
import { getLocation, searchCampus } from '../lib/routing';
import { CategoryIcon, EmptyState, LocationRow, ViewHeader } from './UI';

const suggestions = ['Library', 'LH 3', 'BIT 201', 'Computer Lab', 'Cafeteria', 'Clinic'];

export default function SearchView({ campus, recentIds, onSelect, onClearRecent }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const results = useMemo(() => searchCampus(campus, query, query ? 30 : 8), [campus, query]);
  const recent = recentIds.map((id) => getLocation(campus, id)).filter(Boolean);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="page search-page">
      <ViewHeader eyebrow="Where would you like to go?" title="Find your way" subtitle="Search buildings, room numbers, offices or course codes." />
      <div className="large-search-box">
        <Search size={22} />
        <input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “LH 3” or “BIT 201”" aria-label="Search campus" />
        {query && <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear search"><X size={19} /></button>}
      </div>

      {!query && (
        <>
          <div className="class-finder-callout">
            <span><GraduationCap size={24} /></span>
            <div><strong>Looking for your class?</strong><p>Enter a course code like <b>BIT 201</b> to find its room and indoor directions.</p></div>
            <Sparkles size={20} />
          </div>
          <div className="suggestion-chips">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => setQuery(suggestion)}>{suggestion}<ArrowUpRight size={14} /></button>)}</div>
        </>
      )}

      <section className="search-results-section">
        <div className="section-title-row">
          <h2>{query ? `Results for “${query}”` : 'Popular places'}</h2>
          {query && <span>{results.length}</span>}
        </div>
        {results.length ? (
          <div className="location-list elevated-list">
            {results.map((result) => (
              <LocationRow key={`${result.location.id}-${result.room?.id || 'place'}`} location={result.location} room={result.room} onClick={() => onSelect(result.location, result.room)} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Search} title="No matching places">Check the spelling or try a broader term such as “library”, “lab” or “hostel”.</EmptyState>
        )}
      </section>

      {!query && recent.length > 0 && (
        <section className="recent-section">
          <div className="section-title-row"><h2><Clock3 size={19} /> Recent searches</h2><button className="text-button" onClick={onClearRecent}>Clear</button></div>
          <div className="location-list">{recent.map((location) => <LocationRow key={location.id} location={location} onClick={() => onSelect(location)} />)}</div>
        </section>
      )}
    </div>
  );
}
