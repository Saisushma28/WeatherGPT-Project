import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import WeatherCard from '../components/WeatherCard';
import HourlyForecast from '../components/HourlyForecast';
import DailyForecast from '../components/DailyForecast';
import WeatherAlertBanner from '../components/WeatherAlertBanner';
import VoiceButton from '../components/VoiceButton';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Home() {
  const { location, currentWeather, forecast, alerts, loading, error, refreshWeather } = useWeather();
  const { t, ruralMode } = useSettings();
  const navigate = useNavigate();

  const handleQuickQuestion = (question) => {
    navigate('/chat', { state: { initialMessage: question } });
  };

  const handleVoiceTranscript = (text) => {
    if (text) {
      navigate('/chat', { state: { initialMessage: text } });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Active Extreme Weather Alerts Banner */}
      <WeatherAlertBanner alerts={alerts} />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={refreshWeather}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Main Weather Overview */}
      {loading && !currentWeather ? (
        <SkeletonLoader type="card" />
      ) : (
        <WeatherCard
          weather={currentWeather}
          locationName={location.name}
          alertCount={alerts.length}
        />
      )}

      {/* AI Quick Prompts & Voice Action Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/50 via-slate-900/80 to-indigo-950/50 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">
                {t.chat.title}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {t.chat.subtitle}
            </p>
          </div>

          {/* Prominent Microphone Voice Button */}
          <div className="flex items-center gap-3">
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              size="large"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white">Voice Assistant</p>
              <p className="text-[10px] text-slate-400">Speak in EN / తె / हि</p>
            </div>
          </div>
        </div>

        {/* Quick Question Pills */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
          {t.chat.suggestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickQuestion(q)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 hover:border-sky-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquare className="w-3 h-3 text-sky-400" />
              <span>{q}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-50 ml-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Forecasts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Forecast */}
        {loading && !forecast ? (
          <SkeletonLoader type="forecast" />
        ) : (
          <HourlyForecast hourly={forecast?.hourly || []} />
        )}

        {/* 7-Day Forecast */}
        {loading && !forecast ? (
          <SkeletonLoader type="forecast" />
        ) : (
          <DailyForecast daily={forecast?.daily || []} />
        )}
      </div>
    </div>
  );
}
