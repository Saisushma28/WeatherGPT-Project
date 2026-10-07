import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  CloudRain,
  Thermometer,
  Wind,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import weatherApi from '../services/api';
import VoiceButton from '../components/VoiceButton';

export default function Chat() {
  const routerLocation = useLocation();
  const { location } = useWeather();
  const { language, goal, t, speakText, stopSpeaking, voiceAutoPlay } = useSettings();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: t.chat.subtitle,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['Open-Meteo Meteorological System'],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle incoming query from navigation (e.g. quick question from Home)
  useEffect(() => {
    if (routerLocation.state?.initialMessage) {
      handleSendMessage(routerLocation.state.initialMessage);
      window.history.replaceState({}, document.title);
    }
  }, [routerLocation.state]);

  const handleSendMessage = async (queryText = inputMessage) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMsg = {
      id: String(Date.now()),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const payload = {
        message: text,
        language,
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.name,
        goal,
      };

      const res = await weatherApi.chat(payload);
      const data = res.data;

      const aiMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: data.answer,
        language: data.language || language,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        weatherData: data.weather_data,
        location: data.location,
        sources: data.sources || ['Open-Meteo'],
        intent: data.intent,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If auto-speech enabled, read aloud
      if (voiceAutoPlay) {
        speakText(data.answer, data.language || language);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: 'Sorry, I encountered an issue retrieving real-time meteorological data. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: ['Error Handler'],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeech = (msgId, text, lang) => {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      speakText(text, lang);
      setSpeakingMsgId(msgId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header Info Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-4 shadow-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{t.chat.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Ground Truth Verified
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-400" />
                {location.name}
              </span>
              <span>•</span>
              <span className="capitalize">Persona: {goal}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {t.chat.suggestions.slice(0, 2).map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(s)}
              className="hidden sm:inline-block px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSpeaking = speakingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-none backdrop-blur-md'
                }`}
              >
                {/* Message Body */}
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>

                {/* Embedded Weather Card if returned in AI response */}
                {msg.weatherData && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1 text-sky-400">
                        <Thermometer className="w-3.5 h-3.5" />
                        {msg.location?.name || location.name}
                      </span>
                      <span className="text-[11px] text-slate-400 uppercase">
                        {msg.weatherData.date || 'Today'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Temp</span>
                        <span className="font-bold text-white text-sm">
                          {msg.weatherData.temperature ?? msg.weatherData.temperature_max}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Condition</span>
                        <span className="font-medium text-slate-200">
                          {msg.weatherData.condition}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Rain Chance</span>
                        <span className="font-bold text-sky-300">
                          {msg.weatherData.rain_probability}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Footer: Timestamp, TTS speech button, Source */}
                <div className="flex items-center justify-between gap-3 mt-2.5 pt-1.5 border-t border-white/10 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{msg.time}</span>
                    {msg.sources && (
                      <span className="hidden sm:inline text-slate-500">
                        • {msg.sources.join(', ')}
                      </span>
                    )}
                  </div>

                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => toggleSpeech(msg.id, msg.text, msg.language || language)}
                      className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium transition-colors"
                      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 text-slate-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>{t.chat.processing}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Prominent Voice and Send controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2"
      >
        <VoiceButton
          onTranscript={(text) => handleSendMessage(text)}
          onStateChange={setVoiceStatus}
          disabled={loading}
        />

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={t.chat.inputPlaceholder}
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-sky-500/20 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
