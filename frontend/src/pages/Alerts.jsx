import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Info,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import { getAlertColorClass } from '../utils/formatters';

export default function Alerts() {
  const { alerts, location, loading } = useWeather();
  const { t } = useSettings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span>{t.alerts.title}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.alerts.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            Monitoring: <strong className="text-white">{location.name}</strong>
          </span>
        </div>
      </div>

      {/* Alert status content */}
      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-slate-900 p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Green Status: No Active Severe Alerts
            </h3>
            <p className="text-sm text-slate-400 max-w-lg mx-auto mt-1">
              Meteorological indicators for {location.name} are currently within safe baseline parameters. No critical heatwave, gale, or severe rainfall warnings active.
            </p>
          </div>
          <div className="pt-2 text-xs text-slate-500">
            Threshold Rules Active: IMD Heatwave (Tmax &gt;= 40°C), Heavy Rain (&gt;= 64.5 mm/24h), High Wind Gusts (&gt;= 50 km/h).
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const colorClass = getAlertColorClass(alert.color);

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-6 shadow-2xl transition-all ${colorClass}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-red-500/20 text-red-300">
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                          {alert.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {alert.alert_type}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1">
                        {alert.headline}
                      </h2>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-300 space-y-0.5">
                    <div>Affected: <strong className="text-white">{alert.affected_location}</strong></div>
                    <div className="text-[11px] opacity-75">Source: {alert.source}</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-200 mt-4 leading-relaxed">
                  {alert.description}
                </p>

                {/* Precautions */}
                {alert.precautions?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      {t.alerts.precautions}
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-100">
                      {alert.precautions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* IMD Threshold Standard Reference Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400 space-y-3">
        <h4 className="font-semibold text-slate-200 text-sm">
          About Meteorological Warning Criteria (IMD Standards)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <span className="font-bold text-yellow-400 block mb-1">Yellow (Watch)</span>
            Heavy Rain (64.5 - 115.5 mm) or Moderate Heatwave (Tmax &gt;= 40°C). Be aware and keep track of updates.
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <span className="font-bold text-amber-400 block mb-1">Orange (Alert)</span>
            Very Heavy Rain (115.6 - 204.4 mm) or Severe Squall/Thunderstorms. Be prepared for disruption.
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <span className="font-bold text-red-400 block mb-1">Red (Warning)</span>
            Extremely Heavy Rain (&gt;= 204.5 mm) or Severe Heatwave (&gt;= 45°C). Take emergency precautions.
          </div>
        </div>
      </div>
    </div>
  );
}
