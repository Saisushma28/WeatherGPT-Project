import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  TrendingUp,
  CloudRain,
  Wind,
  Sun,
  Droplets,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import DailyForecast from '../components/DailyForecast';
import HourlyForecast from '../components/HourlyForecast';
import SkeletonLoader from '../components/SkeletonLoader';
import { formatTemp } from '../utils/formatters';

export default function Forecast() {
  const { forecast, location, loading } = useWeather();
  const { t, tempUnit } = useSettings();
  const [activeTab, setActiveTab] = useState('temp'); // temp or rain

  if (loading && !forecast) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <SkeletonLoader type="forecast" />
        <SkeletonLoader type="forecast" />
      </div>
    );
  }

  const hourlyChartData = (forecast?.hourly || []).slice(0, 24).map((h) => ({
    time: h.time.split('T')[1]?.slice(0, 5) || h.time,
    temp: Math.round(h.temperature),
    rainProb: h.rain_probability,
    precip: h.precipitation,
    humidity: h.humidity,
    wind: Math.round(h.wind_speed),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-400" />
            <span>{t.nav.forecast} — {location.name}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            High-resolution 7-day numerical meteorological forecast models.
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('temp')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'temp'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Temperature Trend
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rain')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'rain'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Rain Probability
          </button>
        </div>
      </div>

      {/* 24-Hour Interactive Chart Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            24-Hour Meteorological Dynamics
          </h3>
          <span className="text-xs text-slate-500">Hourly Model Output</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'temp' ? (
              <AreaChart data={hourlyChartData}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} unit="°C" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="temp" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#tempGradient)" name="Temperature (°C)" />
              </AreaChart>
            ) : (
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="rainProb" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Rain Probability (%)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Hourly Horizontal and 7-Day Cards */}
      <HourlyForecast hourly={forecast?.hourly || []} />
      <DailyForecast daily={forecast?.daily || []} />
    </div>
  );
}
