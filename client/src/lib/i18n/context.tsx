import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type TranslationKeys } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const STORAGE_KEY = 'memories-language';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'pt' || stored === 'es')) {
      return stored;
    }
    
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === 'pt') return 'pt';
    if (browserLang === 'es') return 'es';
  } catch {
    // localStorage might not be available
  }
  return 'en';
}

const defaultContext: I18nContextType = {
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
};

const I18nContext = createContext<I18nContextType>(defaultContext);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    // Re-check on mount in case localStorage was updated
    setLanguageState(getInitialLanguage());
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage might not be available
    }
  };

  const t = translations[language];

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
