import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Thermometer,
  CloudRain,
  Loader2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import weatherApi from '../services/api';

export default function Climate() {
  const { location } = useWeather();
  const { t, tempUnit } = useSettings();

  // Pre-configured historical ranges
  const [period, setPeriod] = useState('2025_monsoon'); // 2025_monsoon, 2024_summer, 2024_annual
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const PERIOD_RANGES = {
    '2025_monsoon': { start: '2025-07-01', end: '2025-09-30', label: 'Monsoon 2025 (Jul - Sep)' },
    '2025_summer': { start: '2025-03-01', end: '2025-05-31', label: 'Summer 2025 (Mar - May)' },
    '2024_annual': { start: '2024-01-01', end: '2024-12-31', label: 'Full Year 2024' },
  };

  useEffect(() => {
    async function loadHistorical() {
      setLoading(true);
      setError(null);
      const selected = PERIOD_RANGES[period];
      try {
        const res = await weatherApi.getHistorical(
          location.latitude,
          location.longitude,
          selected.start,
          selected.end,
          location.name
        );
        setData(res.data);
      } catch (err) {
        console.error('Historical fetch error:', err);
        setError('Historical data unavailable for this selection or source.');
      } finally {
        setLoading(false);
      }
    }
    loadHistorical();
  }, [location, period]);

  // Aggregate monthly or sample data if large
  const chartPoints = (data?.points || []).filter((_, idx) => {
    if (period === '2024_annual') return idx % 7 === 0; // weekly sample for annual
    return idx % 2 === 0; // every 2 days for seasonal
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-400" />
            <span>{t.climate.title}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.climate.subtitle}
          </p>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(PERIOD_RANGES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                period === key
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <p className="text-sm">Fetching verified climate archive data for {location.name}...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-800/40 bg-rose-950/20 p-6 text-center text-rose-200 flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Visualizations */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MapPin className="w-4 h-4 text-sky-400" />
                Location
              </div>
              <div className="text-xl font-bold text-white mt-1">{location.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Lat: {location.latitude.toFixed(2)}, Lon: {location.longitude.toFixed(2)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Thermometer className="w-4 h-4 text-amber-400" />
                {t.climate.meanTemp}
              </div>
              <div className="text-2xl font-extrabold text-amber-300 mt-1">
                {data.average_temperature}°C
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Calculated over recorded observation days
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CloudRain className="w-4 h-4 text-sky-400" />
                {t.climate.totalRain}
              </div>
              <div className="text-2xl font-extrabold text-sky-300 mt-1">
                {data.total_rainfall} mm
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Cumulative historical precipitation sum
              </div>
            </div>
          </div>

          {/* Temperature Variation Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              {t.climate.tempTrend}
            </h3>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} unit="°C" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="max_temperature" stroke="#f87171" name="Max Temp (°C)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="mean_temperature" stroke="#fbbf24" name="Mean Temp (°C)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="min_temperature" stroke="#38bdf8" name="Min Temp (°C)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rainfall Accumulation Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-sky-400" />
              {t.climate.rainTrend}
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="mm" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Bar dataKey="precipitation" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Daily Rain (mm)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
