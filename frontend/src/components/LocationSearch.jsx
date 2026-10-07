import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import weatherApi from '../services/api';

export default function LocationSearch({ onSelect }) {
  const { location, updateLocation, detectDeviceLocation, gpsLoading } = useWeather();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await weatherApi.searchLocation(query.trim());
        setResults(res.data.results || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    updateLocation({
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country,
      admin1: item.admin1,
    });
    setQuery('');
    setIsOpen(false);
    if (onSelect) onSelect();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={location.name ? `${location.name}...` : "Search city (e.g. Hyderabad, Vijayawada)"}
          className="w-full pl-9 pr-10 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-sm text-slate-200 placeholder-slate-400 rounded-lg border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
        />
        {/* GPS location button */}
        <button
          type="button"
          onClick={detectDeviceLocation}
          title="Detect my device GPS location"
          disabled={gpsLoading}
          className="absolute right-2 p-1 text-slate-400 hover:text-sky-400 disabled:opacity-50 transition-colors"
        >
          {gpsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={`${item.latitude}-${item.longitude}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-3.5 py-2.5 text-left text-sm hover:bg-sky-500/20 flex items-center space-x-2.5 transition-colors border-b border-slate-700/40 last:border-0"
            >
              <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div className="truncate">
                <span className="font-medium text-slate-100">{item.name}</span>
                <span className="text-xs text-slate-400 ml-1.5">
                  {[item.admin1, item.country].filter(Boolean).join(', ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
