import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WeatherProvider } from './context/WeatherContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Forecast from './pages/Forecast';
import MapPage from './pages/Map';
import Alerts from './pages/Alerts';
import Agriculture from './pages/Agriculture';
import Climate from './pages/Climate';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <SettingsProvider>
      <WeatherProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col text-slate-100 selection:bg-sky-500 selection:text-white">
            <Navbar />
            <main className="flex-1 pb-12">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/forecast" element={<Forecast />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/agriculture" element={<Agriculture />} />
                <Route path="/climate" element={<Climate />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </WeatherProvider>
    </SettingsProvider>
  );
}
