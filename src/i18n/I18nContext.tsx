import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageCode, LanguageMeta, SUPPORTED_LANGUAGES } from './types';
import { TRANSLATIONS, TranslationDict } from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageMeta: LanguageMeta;
  supportedLanguages: LanguageMeta[];
  isRTL: boolean;
  t: (key: keyof TranslationDict, replacements?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, currencyCode?: string, symbol?: string) => string;
  formatNumber: (value: number, maximumFractionDigits?: number) => string;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'vatio_language';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && TRANSLATIONS[saved]) return saved;
      // Try browser language match
      const browserLang = navigator.language?.toLowerCase() || '';
      const matched = SUPPORTED_LANGUAGES.find(
        l => browserLang.startsWith(l.code.toLowerCase()) || (l.code === 'zh-TW' && browserLang.includes('tw'))
      );
      if (matched) return matched.code;
    }
    return 'es';
  });

  const currentLanguageMeta = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const isRTL = currentLanguageMeta.dir === 'rtl';

  const setLanguage = useCallback((newLang: LanguageCode) => {
    if (TRANSLATIONS[newLang]) {
      setLanguageState(newLang);
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  }, []);

  // Update HTML tag dir & lang attributes whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    }
  }, [language, isRTL]);

  const t = useCallback(
    (key: keyof TranslationDict, replacements?: Record<string, string | number>): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.es;
      let text = dict[key] || TRANSLATIONS.en[key] || TRANSLATIONS.es[key] || (key as string);
      if (replacements) {
        Object.entries(replacements).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    },
    [language]
  );

  const formatCurrency = useCallback(
    (amount: number, currencyCode = 'CRC', symbol?: string): string => {
      const safeAmount = Number.isFinite(amount) ? amount : 0;
      try {
        const locale = language === 'ar' ? 'ar-SA' : language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'es-CR';
        if (symbol) {
          // If custom symbol is given (e.g. ₡, $, €), format with clean decimals
          const formatted = new Intl.NumberFormat(locale, {
            minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
          }).format(safeAmount);
          return `${symbol} ${formatted}`;
        }
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
        }).format(safeAmount);
      } catch {
        return `${symbol || currencyCode} ${safeAmount.toFixed(2)}`;
      }
    },
    [language]
  );

  const formatNumber = useCallback(
    (value: number, maximumFractionDigits = 2): string => {
      const safeVal = Number.isFinite(value) ? value : 0;
      try {
        const locale = language === 'ar' ? 'ar-SA' : language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'es-CR';
        return new Intl.NumberFormat(locale, {
          maximumFractionDigits,
        }).format(safeVal);
      } catch {
        return safeVal.toFixed(maximumFractionDigits);
      }
    },
    [language]
  );

  const formatDate = useCallback(
    (dateInput: string | Date, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return String(dateInput);
        const locale = language === 'ar' ? 'ar-SA' : language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'es-CR';
        const defaultOptions: Intl.DateTimeFormatOptions = options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };
        return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
      } catch {
        return String(dateInput);
      }
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguageMeta,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isRTL,
      t,
      formatCurrency,
      formatNumber,
      formatDate,
    }),
    [language, setLanguage, currentLanguageMeta, isRTL, t, formatCurrency, formatNumber, formatDate]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
