import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const STORAGE_KEY = 'bahirdar_itinerary';

export default function Itinerary() {
  const { t } = useLang();
  const { user } = useAuth();
  const [days, setDays] = useState([{ id: 1, items: [] }]);
  const [sites, setSites] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [guides, setGuides] = useState([]);
  const [tripName, setTripName] = useState('My Bahir Dar Trip');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    document.title = 'Itinerary Planner – Visit Bahir Dar';
    // Load from DB if logged in, else from localStorage
    if (user) {
      API.get('/itinerary').then(({ data }) => {
        if (data) {
          setDays(data.days?.length ? data.days : [{ id: 1, items: [] }]);
          setTripName(data.tripName || 'My Bahir Dar Trip');
        }
      }).catch(() => {
        // Fall back to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setDays(JSON.parse(saved));
        const name = localStorage.getItem('bahirdar_trip_name');
        if (name) setTripName(name);
      });
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDays(JSON.parse(saved));
      const name = localStorage.getItem('bahirdar_trip_name');
      if (name) setTripName(name);
    }
  }, [user]);

  useEffect(() => {
    Promise.all([API.get('/sites'), API.get('/hotels'), API.get('/guides')])
      .then(([s, h, g]) => { setSites(s.data); setHotels(h.data); setGuides(g.data); });
  }, []);

  const addDay = () => {
    const newDay = { id: Date.now(), items: [] };
    setDays([...days, newDay]);
  };

  const removeDay = (dayId) => {
    if (days.length === 1) return toast.error('At least one day is required');
    setDays(days.filter(d => d.id !== dayId));
  };

  const addItem = (dayId, item) => {
    setDays(days.map(d => d.id === dayId ? { ...d, items: [...d.items, { ...item, id: Date.now() }] } : d));
  };

  const removeItem = (dayId, itemId) => {
    setDays(days.map(d => d.id === dayId ? { ...d, items: d.items.filter(i => i.id !== itemId) } : d));
  };

  const addCustomItem = (dayId, text) => {
    if (!text.trim()) return;
    addItem(dayId, { type: 'custom', name: text, icon: '📌' });
  };

  const saveItinerary = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    localStorage.setItem('bahirdar_trip_name', tripName);
    if (user) {
      setSyncing(true);
      try {
        await API.put('/itinerary', { tripName, days });
        toast.success('Itinerary saved to your account!');
      } catch {
        toast.error('Failed to save to server, saved locally instead');
      } finally { setSyncing(false); }
    } else {
      toast.success('Itinerary saved locally! Login to sync across devices.');
    }
  };

  const clearAll = () => {
    if (!window.confirm(t.itinerary.clearConfirm)) return;
    setDays([{ id: 1, items: [] }]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Itinerary cleared');
  };

  const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{t.itinerary.title}</h2>
          <p style={styles.sub}>{days.length} days · {totalItems} activities planned</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={saveItinerary} style={styles.saveBtn} disabled={syncing}>
            {syncing ? t.itinerary.saving : t.itinerary.saveBtn}
          </button>
          <button onClick={clearAll} style={styles.clearBtn}>{t.itinerary.clearBtn}</button>
        </div>
      </div>

      <input style={styles.tripName} value={tripName} onChange={e => setTripName(e.target.value)} placeholder={t.itinerary.tripName} />

      {/* Quick Add Suggestions */}
      <div style={styles.suggestions}>
        <h4 style={styles.suggestTitle}>{t.itinerary.quickAdd}</h4>
        <div style={styles.suggestTabs}>
          {[
            { label: '⛪ Sites', items: sites.slice(0, 5), icon: '⛪', type: 'site' },
            { label: '🏨 Hotels', items: hotels.slice(0, 5), icon: '🏨', type: 'hotel' },
            { label: '🧭 Guides', items: guides.slice(0, 5), icon: '🧭', type: 'guide' },
          ].map(group => (
            <div key={group.type} style={styles.suggestGroup}>
              <p style={styles.groupLabel}>{group.label}</p>
              {group.items.map(item => (
                <div key={item._id} style={styles.suggestItem}>
                  <span>{item.name || item.user?.name}</span>
                  <select style={styles.daySelect} defaultValue="" onChange={e => {
                    if (!e.target.value) return;
                    addItem(Number(e.target.value), { type: group.type, name: item.name || item.user?.name, icon: group.icon, id: item._id });
                    e.target.value = '';
                  }}>
                    <option value="">+ Add to day</option>
                    {days.map((d, i) => <option key={d.id} value={d.id}>{t.itinerary.dayLabel} {i + 1}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Days */}
      <div style={styles.days}>
        {days.map((day, index) => (
          <DayCard
            key={day.id}
            day={day}
            index={index}
            t={t}
            onRemoveDay={() => removeDay(day.id)}
            onRemoveItem={(itemId) => removeItem(day.id, itemId)}
            onAddCustom={(text) => addCustomItem(day.id, text)}
          />
        ))}
      </div>

      <button onClick={addDay} style={styles.addDayBtn}>{t.itinerary.addDay}</button>
    </div>
  );
}

function DayCard({ day, index, t, onRemoveDay, onRemoveItem, onAddCustom }) {
  const [customText, setCustomText] = useState('');

  return (
    <div style={styles.dayCard}>
      <div style={styles.dayHeader}>
        <h3 style={styles.dayTitle}>{t.itinerary.dayLabel} {index + 1}</h3>
        <button onClick={onRemoveDay} style={styles.removeDayBtn}>{t.itinerary.removeDay}</button>
      </div>

      {day.items.length === 0 && <p style={styles.noItems}>{t.itinerary.noItems}</p>}

      <div style={styles.itemsList}>
        {day.items.map((item, i) => (
          <div key={item.id} style={styles.item}>
            <span style={styles.itemNum}>{i + 1}</span>
            <span style={styles.itemIcon}>{item.icon}</span>
            <span style={styles.itemName}>{item.name}</span>
            <span style={styles.itemType}>{item.type}</span>
            <button onClick={() => onRemoveItem(item.id)} style={styles.removeItemBtn}>✕</button>
          </div>
        ))}
      </div>

      <div style={styles.addCustom}>
        <input
          style={styles.customInput}
          placeholder={t.itinerary.placeholder}
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { onAddCustom(customText); setCustomText(''); } }}
        />
        <button onClick={() => { onAddCustom(customText); setCustomText(''); }} style={styles.addItemBtn}>
          {t.itinerary.addItem}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' },
  title: { color: '#1a6b3c', margin: 0 },
  sub: { color: '#888', fontSize: '0.9rem', margin: '0.3rem 0 0' },
  headerActions: { display: 'flex', gap: '0.8rem' },
  saveBtn: { padding: '0.7rem 1.5rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  clearBtn: { padding: '0.7rem 1.5rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  tripName: { width: '100%', padding: '0.8rem', border: '2px solid #1a6b3c', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem', boxSizing: 'border-box', color: '#1a6b3c' },
  suggestions: { background: '#f0f7f3', padding: '1.2rem', borderRadius: '10px', marginBottom: '2rem' },
  suggestTitle: { color: '#1a6b3c', margin: '0 0 1rem' },
  suggestTabs: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  suggestGroup: { background: '#fff', padding: '1rem', borderRadius: '8px' },
  groupLabel: { fontWeight: 'bold', color: '#1a6b3c', margin: '0 0 0.8rem' },
  suggestItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem' },
  daySelect: { padding: '0.3rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' },
  days: { display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' },
  dayCard: { background: '#fff', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderLeft: '4px solid #1a6b3c' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  dayTitle: { color: '#1a6b3c', margin: 0 },
  removeDayBtn: { background: 'transparent', border: '1px solid #e53e3e', color: '#e53e3e', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  noItems: { color: '#aaa', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '1rem' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' },
  item: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0.8rem', background: '#f9f9f9', borderRadius: '6px' },
  itemNum: { background: '#1a6b3c', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 },
  itemIcon: { fontSize: '1.1rem' },
  itemName: { flex: 1, fontSize: '0.9rem', fontWeight: '500' },
  itemType: { fontSize: '0.75rem', color: '#888', textTransform: 'capitalize', background: '#e6f4ed', padding: '0.1rem 0.5rem', borderRadius: '10px' },
  removeItemBtn: { background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem' },
  addCustom: { display: 'flex', gap: '0.5rem' },
  customInput: { flex: 1, padding: '0.7rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' },
  addItemBtn: { padding: '0.7rem 1rem', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' },
  addDayBtn: { width: '100%', padding: '1rem', background: 'transparent', border: '2px dashed #1a6b3c', color: '#1a6b3c', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
};
