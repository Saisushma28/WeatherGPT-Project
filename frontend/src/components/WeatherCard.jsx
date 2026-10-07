import React from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Gauge,
  Eye,
  Sunrise,
  Sunset,
  ShieldAlert,
  Compass,
  Thermometer,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { formatTemp } from '../utils/formatters';

export default function WeatherCard({ weather, locationName, alertCount = 0 }) {
  const { t, tempUnit, ruralMode } = useSettings();

  if (!weather) return null;

  const getWeatherIcon = (code, isDay = 1) => {
    if (code >= 95) return <CloudLightning className="w-12 h-12 text-amber-400" />;
    if (code >= 71) return <CloudSnow className="w-12 h-12 text-sky-200" />;
    if (code >= 51 || code >= 80) return <CloudRain className="w-12 h-12 text-blue-400" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-12 h-12 text-slate-300" />;
    return <Sun className="w-12 h-12 text-amber-400 animate-spin-slow" />;
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-sky-950/40 backdrop-blur-md shadow-2xl p-6 transition-all ${ruralMode ? 'text-lg' : ''}`}>
      {/* Background soft ambient gradient */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`font-bold text-slate-100 ${ruralMode ? 'text-3xl' : 'text-2xl'}`}>
              {locationName || weather.location?.name || 'Current Location'}
            </h2>
            {alertCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                {alertCount} {alertCount === 1 ? 'Alert' : 'Alerts'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.weather.dataSource}: {weather.source} • {t.weather.lastUpdated}: {new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Condition & Icon badge */}
        <div className="flex items-center gap-3 bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/40">
          {getWeatherIcon(weather.condition_code, weather.is_day)}
          <div>
            <div className="font-semibold text-slate-100">{weather.condition}</div>
            <div className="text-xs text-slate-400">
              {weather.is_day ? 'Daytime' : 'Night'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Temperature Display */}
      <div className="relative z-10 py-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline">
            <span className={`font-extrabold tracking-tight text-white ${ruralMode ? 'text-7xl' : 'text-6xl sm:text-7xl'}`}>
              {formatTemp(weather.temperature, tempUnit)}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-sky-400" />
            {t.weather.feelsLike}:{' '}
            <span className="font-medium text-slate-200">
              {formatTemp(weather.feels_like, tempUnit)}
            </span>
          </p>
        </div>

        {/* Rain probability highlight card */}
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3 min-w-[150px]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <CloudRain className="w-4 h-4" />
            {t.weather.rainProb}
          </div>
          <div className="text-2xl font-bold text-sky-200 mt-0.5">
            {weather.rain_probability}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Precipitation: {weather.precipitation.toFixed(1)} mm
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {/* Humidity */}
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            {t.weather.humidity}
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {weather.humidity}%
          </div>
        </div>

        {/* Wind */}
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            {t.weather.windSpeed}
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {weather.wind_speed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
            {weather.wind_direction_cardinal && (
              <span className="text-xs font-medium text-teal-400 ml-1.5">
                {weather.wind_direction_cardinal}
              </span>
            )}
          </div>
        </div>

        {/* Pressure */}
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            {t.weather.pressure}
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {Math.round(weather.pressure)} <span className="text-xs font-normal text-slate-400">hPa</span>
          </div>
        </div>

        {/* Visibility / UV */}
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            {t.weather.visibility}
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {weather.visibility.toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
        </div>
      </div>

      {/* Sunrise & Sunset footer */}
      {(weather.sunrise || weather.sunset) && (
        <div className="relative z-10 flex items-center justify-end gap-5 mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
          {weather.sunrise && (
            <div className="flex items-center gap-1.5">
              <Sunrise className="w-4 h-4 text-amber-400" />
              <span>{t.weather.sunrise}:</span>
              <span className="font-medium text-slate-200">{weather.sunrise.split('T')[1] || weather.sunrise}</span>
            </div>
          )}
          {weather.sunset && (
            <div className="flex items-center gap-1.5">
              <Sunset className="w-4 h-4 text-orange-400" />
              <span>{t.weather.sunset}:</span>
              <span className="font-medium text-slate-200">{weather.sunset.split('T')[1] || weather.sunset}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
