import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function VoiceButton({ onTranscript, onStateChange, disabled = false, size = 'default' }) {
  const { language, t } = useSettings();
  const [voiceState, setVoiceState] = useState('idle'); // idle, listening, processing, speaking, error
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (onStateChange) onStateChange(voiceState);
  }, [voiceState, onStateChange]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome or Edge.');
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Locale mapping
      if (language === 'te') {
        recognition.lang = 'te-IN';
      } else if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceState('processing');
        if (onTranscript) {
          onTranscript(transcript);
        }
        setTimeout(() => setVoiceState('idle'), 1500);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setVoiceState('error');
        setTimeout(() => setVoiceState('idle'), 3000);
      };

      recognition.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 3000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState('idle');
  };

  const handleClick = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  // Size styling
  const isLarge = size === 'large';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={
        voiceState === 'listening'
          ? t.chat.listening
          : voiceState === 'processing'
          ? t.chat.processing
          : 'Click to speak'
      }
      className={`relative inline-flex items-center justify-center transition-all rounded-full select-none ${
        isLarge ? 'w-14 h-14' : 'w-10 h-10'
      } ${
        voiceState === 'listening'
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse scale-105 ring-4 ring-red-500/30'
          : voiceState === 'processing'
          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20'
          : voiceState === 'speaking'
          ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/30'
          : voiceState === 'error'
          ? 'bg-rose-700 text-white'
          : 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20 hover:scale-105 active:scale-95'
      }`}
    >
      {voiceState === 'listening' ? (
        <Mic className={isLarge ? 'w-7 h-7 animate-bounce' : 'w-5 h-5 animate-bounce'} />
      ) : voiceState === 'processing' ? (
        <Loader2 className={`${isLarge ? 'w-7 h-7' : 'w-5 h-5'} animate-spin`} />
      ) : voiceState === 'speaking' ? (
        <Volume2 className={isLarge ? 'w-7 h-7 animate-pulse' : 'w-5 h-5 animate-pulse'} />
      ) : voiceState === 'error' ? (
        <AlertCircle className={isLarge ? 'w-7 h-7' : 'w-5 h-5'} />
      ) : (
        <Mic className={isLarge ? 'w-6 h-6' : 'w-5 h-5'} />
      )}
    </button>
  );
}
