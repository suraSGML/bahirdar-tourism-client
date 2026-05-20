import { useEffect, useState } from 'react';

const WMO = {
  0: { label: 'Clear Sky', icon: '☀️' }, 1: { label: 'Mainly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' }, 3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' }, 48: { label: 'Foggy', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' }, 61: { label: 'Light Rain', icon: '🌧️' },
  63: { label: 'Moderate Rain', icon: '🌧️' }, 65: { label: 'Heavy Rain', icon: '🌧️' },
  80: { label: 'Rain Showers', icon: '🌦️' }, 95: { label: 'Thunderstorm', icon: '⛈️' },
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=11.5936&longitude=37.3906&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Africa%2FAddis_Ababa&forecast_days=5')
      .then(r => r.json()).then(setWeather).catch(() => {});
  }, []);

  if (!weather) return null;

  const cur = weather.current;
  const daily = weather.daily;
  const wmo = WMO[cur.weathercode] || { label: 'Unknown', icon: '🌡️' };

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-xl animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/70 text-xs mb-1">📍 Bahir Dar, Ethiopia</p>
          <div className="flex items-center gap-3">
            <span className="text-5xl">{wmo.icon}</span>
            <span className="text-5xl font-bold">{Math.round(cur.temperature_2m)}°C</span>
          </div>
          <p className="text-white/80 text-sm mt-1">{wmo.label}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-white/70 text-xs">💨 {cur.windspeed_10m} km/h</p>
          <p className="text-white/70 text-xs">💧 {cur.relative_humidity_2m}%</p>
        </div>
      </div>
      <div className="border-t border-white/20 pt-3 flex justify-between">
        {daily.time?.slice(0, 5).map((date, i) => {
          const d = new Date(date);
          const fw = WMO[daily.weathercode[i]] || { icon: '🌡️' };
          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className="text-white/60 text-xs">{i === 0 ? 'Today' : DAYS[d.getDay()]}</span>
              <span className="text-lg">{fw.icon}</span>
              <span className="text-white font-semibold text-xs">{Math.round(daily.temperature_2m_max[i])}°</span>
              <span className="text-white/50 text-xs">{Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
