import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Compass, MapPin, CloudRain, Wind, Thermometer, ShieldAlert, Loader2 } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import weatherApi from '../services/api';
import { formatTemp } from '../utils/formatters';

// Custom Marker Icon generator for Leaflet
function createWeatherMarker(temp, condition, hasAlert = false) {
  return L.divIcon({
    className: 'custom-weather-marker',
    html: `
      <div style="
        background: ${hasAlert ? '#ef4444' : '#0284c7'};
        color: white;
        padding: 4px 8px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        border: 2px solid white;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span>${temp ? Math.round(temp) + '°' : '📍'}</span>
      </div>
    `,
    iconSize: [40, 24],
    iconAnchor: [20, 12],
  });
}

// Major Indian benchmark cities for regional weather comparison on map
const BENCHMARK_CITIES = [
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Vijayawada', lat: 16.5062, lon: 80.6480 },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
];

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 9, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

function MapClickHandler({ onLocationClick }) {
  useMapEvents({
    click: async (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPage() {
  const { location, currentWeather, updateLocation } = useWeather();
  const { t, tempUnit } = useSettings();

  const [clickedWeather, setClickedWeather] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [loadingClick, setLoadingClick] = useState(false);
  const [benchmarkWeathers, setBenchmarkWeathers] = useState({});

  // Fetch benchmark city weathers on mount
  useEffect(() => {
    async function loadBenchmarks() {
      const results = {};
      await Promise.allSettled(
        BENCHMARK_CITIES.map(async (c) => {
          try {
            const res = await weatherApi.getCurrentWeather(c.lat, c.lon, c.name);
            results[c.name] = res.data;
          } catch (e) {
            // continue
          }
        })
      );
      setBenchmarkWeathers(results);
    }
    loadBenchmarks();
  }, []);

  const handleMapClick = async (lat, lon) => {
    setLoadingClick(true);
    setClickedLocation({ lat, lon });
    try {
      const res = await weatherApi.getCurrentWeather(lat, lon, `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
      setClickedWeather(res.data);
    } catch (err) {
      console.error('Click error:', err);
    } finally {
      setLoadingClick(false);
    }
  };

  const centerPos = [location.latitude, location.longitude];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-400" />
            <span>{t.nav.map} — Interactive Weather Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Click anywhere on the map to inspect real-time meteorological conditions and severe warnings.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            Active Position: {location.name}
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
        {loadingClick && (
          <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-sky-400 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Retrieving weather at coordinates...</span>
          </div>
        )}

        <MapContainer
          center={centerPos}
          zoom={8}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFlyTo center={centerPos} />
          <MapClickHandler onLocationClick={handleMapClick} />

          {/* Current Location Marker */}
          {currentWeather && (
            <Marker
              position={centerPos}
              icon={createWeatherMarker(currentWeather.temperature, currentWeather.condition)}
            >
              <Popup>
                <div className="p-1 space-y-1 text-slate-100">
                  <div className="font-bold text-sm text-sky-400">{location.name} (Selected)</div>
                  <div className="text-xs text-slate-300">{currentWeather.condition}</div>
                  <div className="text-base font-extrabold text-white mt-1">
                    {formatTemp(currentWeather.temperature, tempUnit)}
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-700">
                    <div>Rain chance: {currentWeather.rain_probability}%</div>
                    <div>Wind: {currentWeather.wind_speed} km/h</div>
                    <div>Humidity: {currentWeather.humidity}%</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Regional Benchmark City Markers */}
          {BENCHMARK_CITIES.map((c) => {
            const w = benchmarkWeathers[c.name];
            if (!w) return null;
            return (
              <Marker
                key={c.name}
                position={[c.lat, c.lon]}
                icon={createWeatherMarker(w.temperature, w.condition)}
                eventHandlers={{
                  click: () => {
                    updateLocation({
                      name: c.name,
                      latitude: c.lat,
                      longitude: c.lon,
                    });
                  },
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-slate-100">
                    <div className="font-bold text-sm text-sky-400">{c.name}</div>
                    <div className="text-xs text-slate-300">{w.condition}</div>
                    <div className="text-base font-extrabold text-white">
                      {formatTemp(w.temperature, tempUnit)}
                    </div>
                    <button
                      onClick={() =>
                        updateLocation({
                          name: c.name,
                          latitude: c.lat,
                          longitude: c.lon,
                        })
                      }
                      className="mt-1 text-[10px] px-2 py-1 rounded bg-sky-600 text-white hover:bg-sky-500 font-semibold"
                    >
                      Set as Active Location
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Clicked Coordinate Marker */}
          {clickedLocation && clickedWeather && (
            <Marker
              position={[clickedLocation.lat, clickedLocation.lon]}
              icon={createWeatherMarker(clickedWeather.temperature, clickedWeather.condition)}
            >
              <Popup>
                <div className="p-1 space-y-1 text-slate-100">
                  <div className="font-bold text-sm text-amber-400">Inspected Coordinates</div>
                  <div className="text-xs text-slate-300">
                    Lat: {clickedLocation.lat.toFixed(3)}, Lon: {clickedLocation.lon.toFixed(3)}
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {formatTemp(clickedWeather.temperature, tempUnit)}
                  </div>
                  <div className="text-xs text-slate-300">{clickedWeather.condition}</div>
                  <button
                    onClick={() =>
                      updateLocation({
                        name: `Point (${clickedLocation.lat.toFixed(2)}, ${clickedLocation.lon.toFixed(2)})`,
                        latitude: clickedLocation.lat,
                        longitude: clickedLocation.lon,
                      })
                    }
                    className="mt-1 text-[10px] px-2 py-1 rounded bg-sky-600 text-white font-semibold"
                  >
                    Load in Dashboard
                  </button>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
