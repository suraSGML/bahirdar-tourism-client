import { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import am from '../locales/am.json';
import ar from '../locales/ar.json';

const translations = { en, am, ar };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  // Apply RTL for Arabic, LTR for others
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  // Keep toggleLang for backward compatibility (cycles en → am → ar → en)
  const toggleLang = () => {
    const cycle = { en: 'am', am: 'ar', ar: 'en' };
    setLanguage(cycle[lang]);
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
