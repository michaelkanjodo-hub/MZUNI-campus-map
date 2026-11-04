import { useMemo, useState } from 'react';
import { Plus, CalendarDays, Navigation, Clock3, MapPin, Bell, Pencil, Trash2, BookOpen, X } from 'lucide-react';
import { DAYS, classEnd, getNextClass, nextClassLabel } from '../lib/format';
import { getLocation, locationsFrom } from '../lib/routing';
import { EmptyState, ModalShell, ViewHeader } from './UI';

const emptyForm = { course: '', room: '', locationId: '', day: '0', time: '08:00', duration: '60', reminder: true, color: '#246b8f' };

export default function TimetableView({ campus, classes, setClasses, onNavigate, onToast }) {
  const today = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(String(today));
  const [form, setForm] = useState(null);
  const nextClass = getNextClass(classes);
  const locations = locationsFrom(campus);
  const dayClasses = useMemo(() => classes.filter((item) => String(item.day) === selectedDay).sort((a, b) => a.time.localeCompare(b.time)), [classes, selectedDay]);

  const openForm = (item = null) => {
    setForm(item ? { ...item, day: String(item.day), duration: String(item.duration || 60), reminder: item.reminder !== false } : { ...emptyForm, day: selectedDay });
  };

  const saveClass = async (event) => {
    event.preventDefault();
    if (!form.locationId) return;
    if (form.reminder && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch { /* Reminders can still appear in the app. */ }
    }
    if (form.id) setClasses(classes.map((item) => item.id === form.id ? { ...form, day: Number(form.day), duration: Number(form.duration) } : item));
    else setClasses([...classes, { ...form, id: crypto.randomUUID?.() || `class-${Date.now()}`, day: Number(form.day), duration: Number(form.duration) }]);
    setForm(null);
    onToast('Class saved on this device');
  };

  const removeClass = (id) => {
    if (window.confirm('Remove this class from your timetable?')) {
      setClasses(classes.filter((item) => item.id !== id));
      onToast('Class removed');
    }
  };

  return (
    <div className="page timetable-page">
      <ViewHeader eyebrow="Your week, organised" title="My timetable" subtitle="Saved privately on this device and available offline." action={<button className="button button-primary add-class-button" onClick={() => openForm()}><Plus size={19} /> Add class</button>} />

      {nextClass ? (
        <section className="next-class-large">
          <div className="next-class-accent" />
          <div className="next-class-top"><span><span className="live-dot" /> NEXT CLASS</span><span>{nextClassLabel(nextClass)}</span></div>
          <div className="next-class-main">
            <div><h2>{nextClass.course}</h2><p><MapPin size={16} />{nextClass.room} · {getLocation(campus, nextClass.locationId)?.properties.name || 'Campus'}</p></div>
            <button className="round-navigate" onClick={() => onNavigate(getLocation(campus, nextClass.locationId))} aria-label={`Navigate to ${nextClass.course}`}><Navigation size={24} fill="currentColor" /></button>
          </div>
          <div className="next-class-bottom"><Clock3 size={15} /> {nextClass.time}–{classEnd(nextClass.time, nextClass.duration)} {nextClass.reminder && <span><Bell size={14} /> Reminder on</span>}</div>
        </section>
      ) : (
        <section className="next-class-large empty-next"><CalendarDays size={28} /><div><h2>No classes yet</h2><p>Add your first class to see one-tap directions here.</p></div></section>
      )}

      <div className="week-strip" role="tablist" aria-label="Day of week">
        {DAYS.map((day, index) => <button role="tab" aria-selected={selectedDay === String(index)} className={selectedDay === String(index) ? 'active' : ''} key={day} onClick={() => setSelectedDay(String(index))}><span>{day.slice(0, 3)}</span><small>{classes.filter((item) => Number(item.day) === index).length || ''}</small></button>)}
      </div>

      <section className="schedule-section">
        <div className="section-title-row"><h2>{DAYS[selectedDay]}{Number(selectedDay) === today && <span className="today-label">Today</span>}</h2><span>{dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}</span></div>
        {dayClasses.length ? (
          <div className="schedule-list">
            {dayClasses.map((item) => {
              const location = getLocation(campus, item.locationId);
              return (
                <article className="schedule-card" key={item.id} style={{ '--class-color': item.color || '#246b8f' }}>
                  <div className="schedule-time"><strong>{item.time}</strong><span>{classEnd(item.time, item.duration)}</span></div>
                  <div className="schedule-details"><h3>{item.course}</h3><p><MapPin size={15} />{item.room}</p><small>{location?.properties.name || 'Location unavailable'}</small></div>
                  <div className="schedule-actions"><button onClick={() => onNavigate(location)} disabled={!location} aria-label="Navigate to class"><Navigation size={19} /></button><button onClick={() => openForm(item)} aria-label="Edit class"><Pencil size={17} /></button><button onClick={() => removeClass(item.id)} aria-label="Delete class"><Trash2 size={17} /></button></div>
                </article>
              );
            })}
          </div>
        ) : <EmptyState icon={BookOpen} title={`No classes on ${DAYS[selectedDay]}`} action={<button className="button button-secondary" onClick={() => openForm()}><Plus size={18} /> Add a class</button>}>Enjoy the free time, or add a class to plan your day.</EmptyState>}
      </section>

      {form && (
        <ModalShell onClose={() => setForm(null)} className="form-sheet" label={form.id ? 'Edit class' : 'Add class'}>
          <form className="sheet-content app-form" onSubmit={saveClass}>
            <span className="eyebrow">Personal timetable</span><h2>{form.id ? 'Edit class' : 'Add a class'}</h2><p>Your timetable stays on this phone.</p>
            <label>Course code or title<input required value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value.toUpperCase() })} placeholder="e.g. BIT 201" /></label>
            <label>Room or class name<input required value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} placeholder="e.g. Room B12" /></label>
            <label>Campus building<select required value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })}><option value="">Choose a building</option>{locations.filter((location) => location.properties.category === 'academic').map((location) => <option key={location.id} value={location.id}>{location.properties.name}</option>)}</select></label>
            <div className="form-row"><label>Day<select value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })}>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label>Starts<input type="time" required value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></label></div>
            <label>Duration<select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}><option value="30">30 minutes</option><option value="60">1 hour</option><option value="90">1 hour 30 minutes</option><option value="120">2 hours</option><option value="180">3 hours</option></select></label>
            <label className="toggle-row form-toggle"><span className="toggle-icon"><Bell size={20} /></span><span><strong>Class reminder</strong><small>Notify 10 minutes before while the app is open</small></span><input type="checkbox" checked={form.reminder} onChange={(event) => setForm({ ...form, reminder: event.target.checked })} /><span className="toggle-control" /></label>
            <div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setForm(null)}>Cancel</button><button type="submit" className="button button-primary">{form.id ? 'Save changes' : 'Add class'}</button></div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
