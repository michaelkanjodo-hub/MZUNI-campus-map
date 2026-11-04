import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationsFrom, pathsFrom } from '../lib/routing';
import { CATEGORY_META, escapeHtml } from '../lib/format';

const DEFAULT_CENTER = [-11.4378, 34.0072];

export default function CampusMap({ campus, selectedId, activeCategory, route, userLocation, onSelect, onMapReady }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const dataLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const userLayerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 16,
      minZoom: 14,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      tap: true,
    });
    mapRef.current = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.attributionControl.setPrefix(false);

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      crossOrigin: true,
    });
    let tileErrors = 0;
    tiles.on('tileerror', () => {
      tileErrors += 1;
      if (tileErrors >= 3) setTilesUnavailable(true);
    });
    tiles.on('tileload', () => setTilesUnavailable(false));
    tiles.addTo(map);

    dataLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 100);
    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = dataLayerRef.current;
    if (!map || !layer || !campus) return;
    layer.clearLayers();

    // A subtle local vector campus footprint is always available offline, even
    // when no OSM raster tiles have been cached.
    L.polygon([
      [-11.4423, 34.0027], [-11.4420, 34.0130], [-11.4323, 34.0124],
      [-11.4319, 34.0028],
    ], { color: '#6f9d88', weight: 1, dashArray: '5 7', fillColor: '#dfeade', fillOpacity: 0.2, interactive: false }).addTo(layer);

    for (const path of pathsFrom(campus)) {
      const closed = path.properties.closed;
      const accessible = path.properties.accessible !== false;
      L.geoJSON(path, {
        interactive: false,
        style: {
          color: closed ? '#c76b5d' : accessible ? '#ffffff' : '#c8cec2',
          weight: closed ? 4 : 5,
          opacity: closed ? 0.8 : 0.85,
          dashArray: closed ? '6 7' : accessible ? null : '3 5',
          lineCap: 'round',
        },
      }).addTo(layer);
    }

    const locations = locationsFrom(campus).filter((location) => activeCategory === 'all' || location.properties.category === activeCategory);
    for (const location of locations) {
      const p = location.properties;
      const selected = String(location.id) === String(selectedId);
      const color = CATEGORY_META[p.category]?.color || '#64748b';
      const icon = L.divIcon({
        className: 'campus-marker-wrapper',
        html: `<div class="campus-marker ${selected ? 'selected' : ''}" style="--marker-color:${color}" aria-label="${escapeHtml(p.name)}"><span class="marker-core"></span></div>`,
        iconSize: selected ? [38, 46] : [30, 38],
        iconAnchor: selected ? [19, 42] : [15, 34],
      });
      const coordinates = location.geometry.coordinates;
      const marker = L.marker([coordinates[1], coordinates[0]], {
        icon,
        keyboard: true,
        title: p.name,
        alt: p.name,
        riseOnHover: true,
      });
      marker.on('click', () => onSelectRef.current?.(location));
      marker.bindTooltip(p.shortName || p.name, {
        direction: 'top', offset: [0, -32], className: selected ? 'campus-tooltip selected-tooltip' : 'campus-tooltip',
      });
      if (selected) marker.openTooltip();
      marker.addTo(layer);
    }
  }, [campus, selectedId, activeCategory]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!route?.coordinates?.length) return;
    const latLngs = route.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
    L.polyline(latLngs, { color: '#ffffff', weight: 10, opacity: 0.92, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(layer);
    L.polyline(latLngs, { color: '#087d6a', weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(layer);
    L.circleMarker(latLngs[0], { radius: 7, color: '#fff', weight: 3, fillColor: '#087d6a', fillOpacity: 1 }).addTo(layer);
    const last = latLngs[latLngs.length - 1];
    L.circleMarker(last, { radius: 9, color: '#fff', weight: 3, fillColor: '#075b50', fillOpacity: 1 }).addTo(layer);
    map.fitBounds(L.latLngBounds(latLngs), { paddingTopLeft: [35, 100], paddingBottomRight: [35, 170], maxZoom: 17 });
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = userLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!userLocation) return;
    const point = [userLocation.latitude, userLocation.longitude];
    L.circle(point, { radius: userLocation.accuracy || 20, color: '#2d73d5', weight: 1, fillColor: '#4a91ea', fillOpacity: 0.12, interactive: false }).addTo(layer);
    const icon = L.divIcon({ className: 'user-location-wrapper', html: '<div class="user-location-dot"><span></span></div>', iconSize: [28, 28], iconAnchor: [14, 14] });
    L.marker(point, { icon, interactive: false, zIndexOffset: 1000 }).addTo(layer);
  }, [userLocation]);

  return (
    <div className="map-container">
      <div ref={containerRef} className="leaflet-map" aria-label="Interactive Mzuzu University campus map" />
      {tilesUnavailable && <div className="offline-map-label">Offline campus map · paths and places remain available</div>}
    </div>
  );
}
