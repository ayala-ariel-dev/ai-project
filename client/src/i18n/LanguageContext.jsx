import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, dictionaries, LANGUAGES } from "./dictionaries";

const LANGUAGE_STORAGE_KEY = "appLanguage";

const LanguageContext = createContext(null);
const defaultMeta = LANGUAGES[DEFAULT_LANGUAGE];
const fallbackContext = {
  language: DEFAULT_LANGUAGE,
  direction: defaultMeta.dir,
  languages: LANGUAGES,
  setLanguage: () => {},
  t: dictionaries[DEFAULT_LANGUAGE],
};

const getStoredLanguage = () => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return dictionaries[stored] ? stored : DEFAULT_LANGUAGE;
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);

  const setLanguage = (nextLanguage) => {
    if (!dictionaries[nextLanguage]) return;
    setLanguageState(nextLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  };

  const meta = LANGUAGES[language];
  const t = dictionaries[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = meta.dir;
  }, [language, meta.dir]);

  const value = useMemo(() => ({
    language,
    direction: meta.dir,
    languages: LANGUAGES,
    setLanguage,
    t,
  }), [language, meta.dir, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context || fallbackContext;
}
