import React from 'react';
import { Languages } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useSettings();

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'te', label: 'తెలుగు (Telugu)', short: 'తె' },
    { code: 'hi', label: 'हिंदी (Hindi)', short: 'हि' },
  ];

  return (
    <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
      <div className="px-2 text-slate-400">
        <Languages className="w-3.5 h-3.5" />
      </div>
      <div className="flex space-x-0.5">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              language === l.code
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            {l.short}
          </button>
        ))}
      </div>
    </div>
  );
}
