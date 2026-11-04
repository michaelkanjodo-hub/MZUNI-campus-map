// A small Dijkstra router. Campus footpaths form a weighted graph; weights are
// walking distance in metres, so routes follow real paths instead of straight
// point-to-point lines. It runs entirely in the browser and works offline.

export function haversine(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLat = lat2 - lat1;
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

export function lineDistance(coordinates) {
  return coordinates.slice(1).reduce((total, point, index) => total + haversine(coordinates[index], point), 0);
}

export function locationsFrom(campus) {
  return (campus?.features || []).filter(
    (feature) => feature.properties?.kind === 'location' && feature.geometry?.type === 'Point',
  );
}

export function pathsFrom(campus) {
  return (campus?.features || []).filter(
    (feature) => feature.properties?.kind === 'path' && feature.geometry?.type === 'LineString',
  );
}

export function getLocation(campus, id) {
  return locationsFrom(campus).find((feature) => String(feature.id) === String(id));
}

export function buildGraph(campus, { accessibleOnly = false, ignoreClosures = false } = {}) {
  const nodes = new Map();
  const addNode = (id, coordinates) => {
    if (!nodes.has(id)) nodes.set(id, { id, coordinates, edges: [] });
  };

  for (const path of pathsFrom(campus)) {
    const p = path.properties;
    const coordinates = path.geometry.coordinates;
    if (!p.from || !p.to || coordinates.length < 2) continue;
    if (!ignoreClosures && p.closed) continue;
    if (accessibleOnly && p.accessible === false) continue;

    addNode(p.from, coordinates[0]);
    addNode(p.to, coordinates[coordinates.length - 1]);
    const metres = lineDistance(coordinates);
    nodes.get(p.from).edges.push({ to: p.to, metres, path, reverse: false });
    nodes.get(p.to).edges.push({ to: p.from, metres, path, reverse: true });
  }
  return nodes;
}

function coordinatesOf(point) {
  if (Array.isArray(point)) return point;
  return point?.geometry?.coordinates || point?.coordinates;
}

function nearestNode(point, graph) {
  const preferred = point?.properties?.nearestNode || point?.nearestNode;
  if (preferred && graph.has(preferred)) return preferred;
  const coordinates = coordinatesOf(point);
  if (!coordinates) return null;
  let closest = null;
  let best = Infinity;
  for (const [id, node] of graph) {
    const distance = haversine(coordinates, node.coordinates);
    if (distance < best) {
      best = distance;
      closest = id;
    }
  }
  return closest;
}

function dijkstra(graph, start, end) {
  const distances = new Map([[start, 0]]);
  const previous = new Map();
  const queue = new Set(graph.keys());

  while (queue.size) {
    let current = null;
    let currentDistance = Infinity;
    for (const id of queue) {
      const distance = distances.get(id) ?? Infinity;
      if (distance < currentDistance) {
        current = id;
        currentDistance = distance;
      }
    }
    if (current === null || currentDistance === Infinity) break;
    queue.delete(current);
    if (current === end) break;

    for (const edge of graph.get(current).edges) {
      if (!queue.has(edge.to)) continue;
      const candidate = currentDistance + edge.metres;
      if (candidate < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, { from: current, edge });
      }
    }
  }

  if (!distances.has(end)) return null;
  const legs = [];
  let cursor = end;
  while (cursor !== start) {
    const step = previous.get(cursor);
    if (!step) return null;
    legs.unshift({ from: step.from, to: cursor, edge: step.edge });
    cursor = step.from;
  }
  return { distance: distances.get(end), legs };
}

function bearing(a, b) {
  const rad = (n) => (n * Math.PI) / 180;
  const lat1 = rad(a[1]);
  const lat2 = rad(b[1]);
  const dLon = rad(b[0] - a[0]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function cardinal(degrees) {
  return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(degrees / 45) % 8];
}

function turnInstruction(previous, current, next) {
  const incoming = bearing(previous, current);
  const outgoing = bearing(current, next);
  const change = ((outgoing - incoming + 540) % 360) - 180;
  if (Math.abs(change) < 35) return 'Continue straight';
  if (Math.abs(change) > 145) return 'Make a U-turn';
  const direction = change > 0 ? 'right' : 'left';
  return Math.abs(change) < 70 ? `Bear ${direction}` : `Turn ${direction}`;
}

function makeSteps(legs, graph, destinationName) {
  if (!legs.length) return [{ instruction: `You have arrived at ${destinationName}`, distance: 0 }];
  const steps = [];
  let distanceOnStep = 0;
  let currentInstruction = '';

  legs.forEach((leg, index) => {
    const pathName = leg.edge.path.properties.name || 'campus path';
    if (index === 0) {
      const from = graph.get(leg.from).coordinates;
      const to = graph.get(leg.to).coordinates;
      currentInstruction = `Head ${cardinal(bearing(from, to))} on ${pathName}`;
    } else {
      const previousLeg = legs[index - 1];
      const previous = graph.get(previousLeg.from).coordinates;
      const current = graph.get(leg.from).coordinates;
      const next = graph.get(leg.to).coordinates;
      const turn = turnInstruction(previous, current, next);
      const newInstruction = `${turn} onto ${pathName}`;
      if (turn !== 'Continue straight' || currentInstruction === '') {
        if (currentInstruction) steps.push({ instruction: currentInstruction, distance: Math.round(distanceOnStep) });
        currentInstruction = newInstruction;
        distanceOnStep = 0;
      } else if (!currentInstruction.includes(pathName)) {
        currentInstruction = `Continue onto ${pathName}`;
      }
    }
    distanceOnStep += leg.edge.metres;
  });
  if (currentInstruction) steps.push({ instruction: currentInstruction, distance: Math.round(distanceOnStep) });
  steps.push({ instruction: `Arrive at ${destinationName}`, distance: 0, arrival: true });
  return steps;
}

export function findRoute(campus, start, destination, options = {}) {
  const graph = buildGraph(campus, options);
  const startId = nearestNode(start, graph);
  const endId = nearestNode(destination, graph);
  if (!startId || !endId) return { error: 'No connected campus paths are available for these points.' };
  const result = dijkstra(graph, startId, endId);
  if (!result) {
    return {
      error: options.accessibleOnly
        ? 'No step-free route is available in the current data. Try the standard route or ask campus staff for assistance.'
        : 'A route cannot be found while the current closures are active.',
    };
  }

  const coordinates = [];
  const startCoordinates = coordinatesOf(start);
  const destinationCoordinates = coordinatesOf(destination);
  if (startCoordinates) coordinates.push(startCoordinates);
  if (graph.has(startId)) coordinates.push(graph.get(startId).coordinates);

  for (const leg of result.legs) {
    const pathCoordinates = leg.edge.path.geometry.coordinates;
    const ordered = leg.edge.reverse ? [...pathCoordinates].reverse() : pathCoordinates;
    coordinates.push(...ordered.slice(1));
  }
  if (destinationCoordinates) coordinates.push(destinationCoordinates);

  const destinationName = destination?.properties?.name || destination?.name || 'your destination';
  const graphDistance = result.distance;
  const connectorDistance =
    (startCoordinates ? haversine(startCoordinates, graph.get(startId).coordinates) : 0) +
    (destinationCoordinates ? haversine(destinationCoordinates, graph.get(endId).coordinates) : 0);
  const distance = Math.round(graphDistance + connectorDistance);
  const speed = campus?.metadata?.walkingSpeedKmh || 4.8;

  return {
    coordinates,
    distance,
    durationMinutes: Math.max(1, Math.round((distance / 1000 / speed) * 60)),
    steps: makeSteps(result.legs, graph, destinationName),
    startNode: startId,
    endNode: endId,
    accessible: !!options.accessibleOnly,
  };
}

export function searchCampus(campus, query, limit = 30) {
  const normalized = query.trim().toLowerCase();
  const results = [];
  for (const location of locationsFrom(campus)) {
    const p = location.properties;
    const nameText = `${p.name} ${p.shortName || ''} ${p.type || ''}`.toLowerCase();
    const nameScore = !normalized ? 1 : p.name.toLowerCase().startsWith(normalized) ? 4 : nameText.includes(normalized) ? 2 : 0;
    if (nameScore) results.push({ location, score: nameScore, label: p.name, subtitle: p.type });
    for (const room of p.rooms || []) {
      const text = [room.name, ...(room.keywords || []), ...(room.courses || [])].join(' ').toLowerCase();
      if (normalized && text.includes(normalized)) {
        const exactCourse = (room.courses || []).some((course) => course.toLowerCase() === normalized);
        results.push({
          location,
          room,
          score: exactCourse ? 6 : room.name.toLowerCase().startsWith(normalized) ? 5 : 3,
          label: room.name,
          subtitle: `${p.name} · Floor ${room.floor ?? 0}${room.courses?.length ? ` · ${room.courses.join(', ')}` : ''}`,
        });
      }
    }
  }
  return results.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label)).slice(0, limit);
}
