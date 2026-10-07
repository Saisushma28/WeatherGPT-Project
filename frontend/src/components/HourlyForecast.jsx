import React from 'react';
import { CloudRain, Wind, Sun, Cloud } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { formatTemp, formatTime } from '../utils/formatters';

export default function HourlyForecast({ hourly = [] }) {
  const { t, tempUnit } = useSettings();
  const items = hourly.slice(0, 24);

  if (!items.length) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Sun className="w-4 h-4 text-sky-400" />
        {t.weather.hourlyForecast}
      </h3>

      <div className="flex space-x-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        {items.map((item, idx) => {
          const timeLabel = idx === 0 ? 'Now' : formatTime(item.time);
          const hasRain = item.rain_probability > 30;

          return (
            <div
              key={item.time || idx}
              className={`flex-shrink-0 flex flex-col items-center justify-between p-3 rounded-xl min-w-[85px] border transition-all ${
                idx === 0
                  ? 'bg-sky-500/15 border-sky-500/30'
                  : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/80'
              }`}
            >
              <span className="text-xs font-medium text-slate-300">{timeLabel}</span>

              {/* Weather icon indicator */}
              <div className="my-2.5">
                {hasRain ? (
                  <CloudRain className="w-6 h-6 text-sky-400" />
                ) : item.weather_code >= 1 && item.weather_code <= 3 ? (
                  <Cloud className="w-6 h-6 text-slate-300" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-400" />
                )}
              </div>

              {/* Temperature */}
              <span className="text-base font-bold text-white">
                {formatTemp(item.temperature, tempUnit)}
              </span>

              {/* Rain chance */}
              <div className="flex items-center gap-1 text-[11px] text-sky-400 mt-1">
                <CloudRain className="w-3 h-3" />
                <span>{item.rain_probability}%</span>
              </div>

              {/* Wind */}
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                <Wind className="w-2.5 h-2.5" />
                <span>{Math.round(item.wind_speed)}k</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
