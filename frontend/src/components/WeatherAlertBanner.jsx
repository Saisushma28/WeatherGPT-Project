import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert, Info } from 'lucide-react';
import { getAlertColorClass } from '../utils/formatters';

export default function WeatherAlertBanner({ alerts = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  const topAlert = alerts[0];
  const colorClass = getAlertColorClass(topAlert.color);

  return (
    <div className={`rounded-2xl border p-4 shadow-xl mb-6 transition-all ${colorClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 mt-0.5">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/30 text-white border border-red-500/40">
                {topAlert.severity} Alert
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {topAlert.alert_type} • {topAlert.affected_location}
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-1">
              {topAlert.headline}
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              {topAlert.description}
            </p>
          </div>
        </div>

        {/* Toggle details */}
        {topAlert.precautions?.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors flex-shrink-0"
          >
            <span>{expanded ? 'Hide Safety Tips' : 'Precautions'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Precautions list */}
      {expanded && topAlert.precautions?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 pl-10 text-xs text-slate-200">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-300" />
            Recommended Safety Actions (IMD Guidelines):
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-200 pl-1">
            {topAlert.precautions.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
