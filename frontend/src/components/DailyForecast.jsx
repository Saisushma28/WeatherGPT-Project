import React from 'react';
import { Calendar, CloudRain, Sun, Cloud, CloudLightning, Wind } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { formatTemp, formatDate } from '../utils/formatters';

export default function DailyForecast({ daily = [] }) {
  const { t, tempUnit } = useSettings();

  if (!daily.length) return null;

  const getIcon = (code) => {
    if (code >= 95) return <CloudLightning className="w-5 h-5 text-amber-400" />;
    if (code >= 51 || code >= 80) return <CloudRain className="w-5 h-5 text-sky-400" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-5 h-5 text-slate-300" />;
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-sky-400" />
        {t.weather.sevenDayForecast}
      </h3>

      <div className="space-y-2.5">
        {daily.map((day, idx) => {
          const dateLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : formatDate(day.date);

          return (
            <div
              key={day.date}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 transition-all"
            >
              {/* Day & Condition */}
              <div className="flex items-center gap-3 min-w-[140px]">
                {getIcon(day.weather_code)}
                <div>
                  <div className="font-medium text-sm text-slate-200">{dateLabel}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[120px]">
                    {day.weather_condition}
                  </div>
                </div>
              </div>

              {/* Rain Probability */}
              <div className="flex items-center gap-1.5 min-w-[70px] text-xs text-sky-400">
                <CloudRain className="w-3.5 h-3.5" />
                <span>{day.rain_probability}%</span>
              </div>

              {/* Wind Speed */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 min-w-[70px]">
                <Wind className="w-3.5 h-3.5 text-slate-500" />
                <span>{Math.round(day.wind_speed_max)} km/h</span>
              </div>

              {/* Temperature High / Low */}
              <div className="flex items-center gap-3 text-sm min-w-[110px] justify-end">
                <span className="font-bold text-white">
                  {formatTemp(day.max_temperature, tempUnit)}
                </span>
                <span className="text-slate-400 font-medium">
                  {formatTemp(day.min_temperature, tempUnit)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
