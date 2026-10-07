import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import weatherApi from '../services/api';

const WeatherContext = createContext();

export function WeatherProvider({ children }) {
 // Location will be detected from the user's device
const [location, setLocation] = useState({
  name: 'Detecting location...',
  latitude: null,
  longitude: null,
  country: '',
  admin1: '',
});

  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const fetchWeatherData = useCallback(async (lat, lon, locName) => {
    setLoading(true);
    setError(null);
    try {
      const [currRes, forecastRes, alertRes] = await Promise.allSettled([
        weatherApi.getCurrentWeather(lat, lon, locName),
        weatherApi.getForecast(lat, lon, locName),
        weatherApi.getAlerts(lat, lon, locName),
      ]);

      if (currRes.status === 'fulfilled') {
        setCurrentWeather(currRes.value.data);
      }
      if (forecastRes.status === 'fulfilled') {
        setForecast(forecastRes.value.data);
      }
      if (alertRes.status === 'fulfilled') {
        setAlerts(alertRes.value.data.alerts || []);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to fetch weather information. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  if (location.latitude === null || location.longitude === null) {
    return;
  }

  fetchWeatherData(location.latitude, location.longitude, location.name);
}, [location, fetchWeatherData]);

  // Browser Geolocation API
  const detectDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode via search or default name
          const searchRes = await weatherApi.searchLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          const name = searchRes.data.results?.[0]?.name || `My Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
          setLocation({
            name,
            latitude,
            longitude,
          });
        } catch {
          setLocation({
            name: `My GPS Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
            latitude,
            longitude,
          });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsLoading(false);
        alert('Could not detect location. Please permit GPS access or search city manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };
  useEffect(() => {
    detectDeviceLocation();
  }, []);
  
  const updateLocation = (newLoc) => {
    setLocation((prev) => ({ ...prev, ...newLoc }));
  };

  return (
    <WeatherContext.Provider
      value={{
        location,
        updateLocation,
        currentWeather,
        forecast,
        alerts,
        loading,
        error,
        gpsLoading,
        detectDeviceLocation,
        refreshWeather: () => fetchWeatherData(location.latitude, location.longitude, location.name),
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}
