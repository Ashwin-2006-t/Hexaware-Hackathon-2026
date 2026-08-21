import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language } from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('silverhands_language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('silverhands_language', lang);
    document.documentElement.setAttribute('lang', lang);
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('silverhands_language', language);
  }, [language]);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language] || translations['en'];

    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to English if key is missing in target language
        let fallback: any = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') return path;

    if (params) {
      let str = current;
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        str = str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
      return str;
    }

    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Graceful fallback for components rendered outside provider
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (path: string, params?: Record<string, string | number>) => {
        const keys = path.split('.');
        let current: any = translations['en'];
        for (const k of keys) {
          if (current && current[k] !== undefined) {
            current = current[k];
          } else {
            return path;
          }
        }
        if (typeof current !== 'string') return path;
        if (params) {
          let str = current;
          Object.entries(params).forEach(([paramKey, paramVal]) => {
            str = str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
          });
          return str;
        }
        return current;
      }
    };
  }
  return ctx;
};
