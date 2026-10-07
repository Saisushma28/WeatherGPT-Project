import React, { useState } from 'react';
import {
  Sprout,
  Droplets,
  Wind,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Calendar,
  Layers,
  Thermometer,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import weatherApi from '../services/api';

export default function Agriculture() {
  const { location } = useWeather();
  const { language, t } = useSettings();

  const [crop, setCrop] = useState('rice');
  const [goal, setGoal] = useState('irrigation');
  const [soilType, setSoilType] = useState('clay_loam');
  const [loading, setLoading] = useState(false);
  const [advisory, setAdvisory] = useState(null);

  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        crop,
        goal,
        soil_type: soilType,
        crop_stage: 'vegetative',
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.name,
        language,
      };
      const res = await weatherApi.getCropAdvisory(payload);
      setAdvisory(res.data);
    } catch (err) {
      console.error('Advisory error:', err);
      alert('Failed to evaluate agricultural advisory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Evaluate on initial mount
  React.useEffect(() => {
    handleEvaluate();
  }, [location]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-400" />
          <span>{t.agriculture.title}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {t.agriculture.subtitle}
        </p>
      </div>

      {/* Decision Configuration Form */}
      <form
        onSubmit={handleEvaluate}
        className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
      >
        {/* Crop Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t.agriculture.selectCrop}
          </label>
          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            className="w-full bg-slate-800 text-sm text-white rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {Object.entries(t.agriculture.crops).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Goal Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t.agriculture.selectGoal}
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full bg-slate-800 text-sm text-white rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {Object.entries(t.agriculture.farmingGoals).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Soil Type Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t.agriculture.selectSoil}
          </label>
          <select
            value={soilType}
            onChange={(e) => setSoilType(e.target.value)}
            className="w-full bg-slate-800 text-sm text-white rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {Object.entries(t.agriculture.soils).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.agriculture.evaluating}</span>
              </>
            ) : (
              <>
                <Sprout className="w-4 h-4" />
                <span>{t.agriculture.generateAdvisory}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Advisory Result Display */}
      {advisory && (
        <div className="space-y-6">
          {/* Main Recommendation Banner */}
          <div
            className={`rounded-2xl border p-6 shadow-2xl transition-all ${
              advisory.action_type === 'postpone'
                ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900 text-amber-100'
                : advisory.action_type === 'caution'
                ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-950/40 via-slate-900/90 to-slate-900 text-yellow-100'
                : 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900 text-emerald-100'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    advisory.action_type === 'postpone'
                      ? 'bg-amber-500/20 text-amber-400'
                      : advisory.action_type === 'caution'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {advisory.action_type === 'postpone' ? (
                    <XCircle className="w-7 h-7" />
                  ) : advisory.action_type === 'caution' ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <CheckCircle2 className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-white/15">
                      Action: {advisory.action_type.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-300">
                      Crop: {advisory.crop} • Goal: {advisory.goal}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                    {advisory.recommendation}
                  </h2>
                </div>
              </div>

              {/* Weather Summary Pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[10px]">Rain Chance</span>
                  <span className="font-bold text-sky-400">
                    {advisory.weather_summary.rain_probability_24h}%
                  </span>
                </div>
                <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[10px]">Max Wind</span>
                  <span className="font-bold text-teal-400">
                    {advisory.weather_summary.max_wind_speed_kmh} km/h
                  </span>
                </div>
                <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[10px]">Max Temp</span>
                  <span className="font-bold text-amber-400">
                    {advisory.weather_summary.temp_max_c}°C
                  </span>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-white/10">
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {advisory.ai_explanation}
              </p>
            </div>

            {/* Rule Engine Reasons List */}
            {advisory.reasoning?.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.agriculture.reasoning}:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {advisory.reasoning.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 3-Day Farming Window Outlook */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              {t.agriculture.window}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {advisory.farming_window?.map((day, idx) => {
                const isSuitable = day.status === 'Suitable';
                const isCaution = day.status === 'Caution';

                return (
                  <div
                    key={day.date || idx}
                    className={`rounded-xl border p-4 transition-all ${
                      isSuitable
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : isCaution
                        ? 'border-yellow-500/40 bg-yellow-950/20'
                        : 'border-rose-500/40 bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-bold text-sm text-white">{day.day_name}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isSuitable
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isCaution
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {day.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Rain probability:</span>
                        <span className="font-bold text-sky-400">{day.rain_probability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected rain:</span>
                        <span className="font-medium text-slate-200">{day.rainfall_mm.toFixed(1)} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wind:</span>
                        <span className="font-medium text-slate-200">{Math.round(day.wind_speed_kmh)} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Temp range:</span>
                        <span className="font-medium text-white">{Math.round(day.temp_min)}° - {Math.round(day.temp_max)}°C</span>
                      </div>
                    </div>

                    <p className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400 italic">
                      {day.advisory_notes}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official Disclaimer */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>{t.agriculture.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
