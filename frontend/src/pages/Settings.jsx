import React from 'react';
import {
  Settings as SettingsIcon,
  Languages,
  User,
  Volume2,
  Smartphone,
  Thermometer,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useWeather } from '../context/WeatherContext';

export default function SettingsPage() {
  const {
    language,
    setLanguage,
    goal,
    setGoal,
    tempUnit,
    setTempUnit,
    ruralMode,
    setRuralMode,
    voiceAutoPlay,
    setVoiceAutoPlay,
    t,
    speakText,
  } = useSettings();

  const { location } = useWeather();

  const testVoice = () => {
    if (language === 'te') {
      speakText('నమస్కారం! వెదర్ జిపిటి కి స్వాగతం. వాతావరణ సమాచారం సిద్ధంగా ఉంది.');
    } else if (language === 'hi') {
      speakText('नमस्ते! वेदर जीपीटी में आपका स्वागत है। मौसम की जानकारी तैयार है।');
    } else {
      speakText('Hello! Welcome to WeatherGPT. Real-time meteorological intelligence is ready.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-sky-400" />
          <span>{t.settings.title}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize language, decision persona, accessibility, and voice assistance.
        </p>
      </div>

      <div className="space-y-4">
        {/* Language Selection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white mb-3">
            <Languages className="w-4 h-4 text-sky-400" />
            <span>{t.settings.language}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { code: 'en', title: 'English', desc: 'Global & Indian English' },
              { code: 'te', title: 'తెలుగు (Telugu)', desc: 'ఆంధ్రప్రదేశ్ & తెలంగాణ' },
              { code: 'hi', title: 'हिंदी (Hindi)', desc: 'उत्तर एवं मध्य भारत' },
            ].map((langItem) => (
              <button
                key={langItem.code}
                type="button"
                onClick={() => setLanguage(langItem.code)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  language === langItem.code
                    ? 'border-sky-500 bg-sky-500/15 text-white shadow-md'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-base">{langItem.title}</div>
                <div className="text-xs text-slate-400 mt-1">{langItem.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Goal / Persona Selection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white mb-3">
            <User className="w-4 h-4 text-sky-400" />
            <span>{t.settings.persona}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'general', title: t.goals.general, desc: 'Daily commute, clothing, umbrella need' },
              { id: 'farmer', title: t.goals.farmer, desc: 'Crop spraying, irrigation, harvest decisions' },
              { id: 'traveler', title: t.goals.traveler, desc: 'Highway driving, squalls, visibility' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  goal === g.id
                    ? 'border-sky-500 bg-sky-500/15 text-white shadow-md'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm">{g.title}</div>
                <div className="text-xs text-slate-400 mt-1">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility & Rural Mode */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Accessibility & Rural Optimization</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div>
              <div className="font-medium text-sm text-white">{t.settings.ruralMode}</div>
              <div className="text-xs text-slate-400">
                Optimized for rural and field conditions with large typography and simplified metrics.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ruralMode}
                onChange={(e) => setRuralMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Voice Auto Read */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div>
              <div className="font-medium text-sm text-white">{t.settings.voiceAutoPlay}</div>
              <div className="text-xs text-slate-400">
                Automatically speak incoming conversational AI responses.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={testVoice}
                className="px-2.5 py-1 text-xs rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
              >
                Test Voice
              </button>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceAutoPlay}
                  onChange={(e) => setVoiceAutoPlay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </div>

          {/* Temperature Units */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div>
              <div className="font-medium text-sm text-white">Temperature Unit</div>
              <div className="text-xs text-slate-400">Choose Celsius or Fahrenheit</div>
            </div>
            <div className="flex items-center bg-slate-700/60 p-1 rounded-lg border border-slate-600">
              <button
                type="button"
                onClick={() => setTempUnit('C')}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  tempUnit === 'C' ? 'bg-sky-500 text-white' : 'text-slate-300'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setTempUnit('F')}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  tempUnit === 'F' ? 'bg-sky-500 text-white' : 'text-slate-300'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </div>

        {/* System & Attribution Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Ground Truth & Source Transparency
          </div>
          <p>
            WeatherGPT synthesizes outputs from validated meteorological models (ECMWF, GFS, ICON) with deterministic decision engines. All severe weather thresholds conform to India Meteorological Department (IMD) standards.
          </p>
          <div className="pt-2 text-slate-500">
            Active Position: {location.name} ({location.latitude.toFixed(2)}, {location.longitude.toFixed(2)})
          </div>
        </div>
      </div>
    </div>
  );
}
