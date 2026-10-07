import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const weatherApi = {
  getCurrentWeather: (latitude, longitude, locationName) =>
    client.get('/api/weather/current', {
      params: { latitude, longitude, location_name: locationName },
    }),

  getForecast: (latitude, longitude, locationName) =>
    client.get('/api/weather/forecast', {
      params: { latitude, longitude, location_name: locationName },
    }),

  getHourly: (latitude, longitude, locationName) =>
    client.get('/api/weather/hourly', {
      params: { latitude, longitude, location_name: locationName },
    }),

  getHistorical: (latitude, longitude, startDate, endDate, locationName) =>
    client.get('/api/weather/historical', {
      params: {
        latitude,
        longitude,
        start_date: startDate,
        end_date: endDate,
        location_name: locationName,
      },
    }),

  searchLocation: (query) =>
    client.get('/api/location/search', {
      params: { q: query },
    }),

  chat: (payload) => client.post('/api/chat', payload),

  getAlerts: (latitude, longitude, locationName) =>
    client.get('/api/alerts', {
      params: { latitude, longitude, location_name: locationName },
    }),

  getCropAdvisory: (payload) => client.post('/api/agriculture/advisory', payload),

  healthCheck: () => client.get('/api/health'),
};

export default weatherApi;
