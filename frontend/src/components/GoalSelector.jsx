import React from 'react';
import { User, Sprout, Car } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function GoalSelector() {
  const { goal, setGoal, t } = useSettings();

  const goals = [
    { id: 'general', label: t.goals.general, icon: User },
    { id: 'farmer', label: t.goals.farmer, icon: Sprout },
    { id: 'traveler', label: t.goals.traveler, icon: Car },
  ];

  return (
    <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
      {goals.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setGoal(id)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
            goal === id
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
          }`}
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">{label.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
}
