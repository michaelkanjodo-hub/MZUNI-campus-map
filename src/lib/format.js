export const CATEGORY_META = {
  academic: { label: 'Academic', color: '#246b8f', icon: 'GraduationCap' },
  hostels: { label: 'Hostels', color: '#8a5a86', icon: 'BedDouble' },
  food: { label: 'Food', color: '#b46a2a', icon: 'Utensils' },
  services: { label: 'Services', color: '#64748b', icon: 'Landmark' },
  sports: { label: 'Sports', color: '#44844f', icon: 'Trophy' },
  emergency: { label: 'Emergency', color: '#c44f4f', icon: 'HeartPulse' },
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function formatDistance(metres) {
  if (!Number.isFinite(metres)) return '—';
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;
}

export function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} hr${rest ? ` ${rest} min` : ''}`;
}

export function floorLabel(floor) {
  if (Number(floor) === 0) return 'Ground floor';
  return `Floor ${floor}`;
}

export function classEnd(time, duration = 60) {
  const [hours, minutes] = time.split(':').map(Number);
  const total = hours * 60 + minutes + Number(duration);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function getNextClass(classes, now = new Date()) {
  const jsDay = now.getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const candidates = [];

  for (const item of classes) {
    for (let offset = 0; offset < 8; offset += 1) {
      const dayIndex = (todayIndex + offset) % 7;
      if (Number(item.day) !== dayIndex) continue;
      const [hours, minutes] = item.time.split(':').map(Number);
      if (offset === 0 && hours * 60 + minutes <= nowMinutes) continue;
      const date = new Date(now);
      date.setDate(now.getDate() + offset);
      date.setHours(hours, minutes, 0, 0);
      candidates.push({ ...item, date, offset });
      break;
    }
  }
  return candidates.sort((a, b) => a.date - b.date)[0] || null;
}

export function nextClassLabel(nextClass, now = new Date()) {
  if (!nextClass) return '';
  if (nextClass.offset === 0) return `Today at ${nextClass.time}`;
  if (nextClass.offset === 1) return `Tomorrow at ${nextClass.time}`;
  return `${DAYS[nextClass.day]} at ${nextClass.time}`;
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}
