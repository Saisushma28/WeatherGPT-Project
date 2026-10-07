import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('weathergpt_lang') || 'en');
  const [goal, setGoal] = useState(() => localStorage.getItem('weathergpt_goal') || 'general');
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem('weathergpt_unit') || 'C');
  const [ruralMode, setRuralMode] = useState(() => localStorage.getItem('weathergpt_rural') === 'true');
  const [voiceAutoPlay, setVoiceAutoPlay] = useState(() => localStorage.getItem('weathergpt_voice_autoplay') === 'true');

  useEffect(() => {
    localStorage.setItem('weathergpt_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('weathergpt_goal', goal);
  }, [goal]);

  useEffect(() => {
    localStorage.setItem('weathergpt_unit', tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    localStorage.setItem('weathergpt_rural', ruralMode);
  }, [ruralMode]);

  useEffect(() => {
    localStorage.setItem('weathergpt_voice_autoplay', voiceAutoPlay);
  }, [voiceAutoPlay]);

  const t = translations[language] || translations.en;

   const speakText = (text, langCode = language) => {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  let targetLang = 'en-IN';

  if (langCode === 'te') {
    targetLang = 'te-IN';
  } else if (langCode === 'hi') {
    targetLang = 'hi-IN';
  }

  utterance.lang = targetLang;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  const speakWithCorrectVoice = () => {
    const voices = window.speechSynthesis.getVoices();

    const exactVoice = voices.find(
      (voice) => voice.lang.toLowerCase() === targetLang.toLowerCase()
    );

    const languageVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith(
          targetLang.split('-')[0].toLowerCase()
        )
    );

    const selectedVoice = exactVoice || languageVoice;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    speakWithCorrectVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      speakWithCorrectVoice();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
};
const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        goal,
        setGoal,
        tempUnit,
        setTempUnit,
        ruralMode,
        setRuralMode,
        voiceAutoPlay,
        setVoiceAutoPlay,
        t,
        speakText,
        stopSpeaking
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
