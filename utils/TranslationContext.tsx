import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { getLanguage, initializeLanguage, Language, setLanguage as setAppLanguage, t as translate, TranslationKey } from './translations';

// Create the context
type TranslationContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isLoading: boolean;
};

const TranslationContext = createContext<TranslationContextType>({
  language: 'English',
  setLanguage: async () => {},
  t: (key) => key,
  isLoading: true,
});

// Create provider component
export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('English');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from AsyncStorage
  useEffect(() => {
    const init = async () => {
      await initializeLanguage();
      setLanguageState(getLanguage());
      setIsLoading(false);
    };
    init();
  }, []);

  // Set language handler
  const setLanguage = async (lang: Language) => {
    await setAppLanguage(lang);
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    return translate(key);
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook for using translations
export const useTranslation = () => useContext(TranslationContext); 