import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  CloudSun,
  MessageSquareText,
  CalendarDays,
  MapPin,
  AlertTriangle,
  Sprout,
  TrendingUp,
  Settings,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import LocationSearch from './LocationSearch';
import LanguageSelector from './LanguageSelector';
import GoalSelector from './GoalSelector';

export default function Navbar() {
  const { t, ruralMode } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t.nav.home, icon: CloudSun },
    { to: '/chat', label: t.nav.chat, icon: MessageSquareText },
    { to: '/forecast', label: t.nav.forecast, icon: CalendarDays },
    { to: '/map', label: t.nav.map, icon: Compass },
    { to: '/alerts', label: t.nav.alerts, icon: AlertTriangle },
    { to: '/agriculture', label: t.nav.agriculture, icon: Sprout },
    { to: '/climate', label: t.nav.climate, icon: TrendingUp },
    { to: '/settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <CloudSun className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
                  WeatherGPT
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30">
                  AI Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                {ruralMode ? 'గ్రామీణ / Rural Mode' : 'Intelligence Platform'}
              </p>
            </div>
          </Link>

          {/* Location Search Bar in Header */}
          <div className="hidden md:block flex-1 max-w-sm">
            <LocationSearch />
          </div>

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center space-x-2">
            <GoalSelector />
            <LanguageSelector />
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links Row */}
        <nav className="hidden lg:flex items-center space-x-1 py-1.5 border-t border-slate-800/60 overflow-x-auto text-sm">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-5 space-y-3">
          <div className="mb-2">
            <LocationSearch onSelect={() => setMobileMenuOpen(false)} />
          </div>
          <div className="py-2 border-y border-slate-800">
            <GoalSelector />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-sky-400" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
