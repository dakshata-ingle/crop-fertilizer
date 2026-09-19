import React, { createContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getSupportedLanguageOptions, translateTextBatch } from '../utils/translationService';
import { translations } from '../constants/translations';
import i18n from '../i18n';

export const TranslationContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (k, options) => {
    const value = translations.en[k] || k;
    if (options && typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, key) => options[key] ?? `{${key}}`);
    }
    return value;
  },
});

export const TranslationProvider = ({ children }) => {
  const { t: i18nT, i18n: i18nInstance } = useTranslation();
  const [language, setLanguage] = useState(() => {
    try {
      return i18nInstance?.language || localStorage.getItem('preferredLanguage') || 'en';
    } catch (err) {
      return 'en';
    }
  });

  const [labels, setLabels] = useState(() => (language === 'en' ? {} : {}));

  useEffect(() => {
    if (i18nInstance?.language) {
      setLanguage(i18nInstance.language);
    }
  }, [i18nInstance?.language]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!language || language === 'en') {
        setLabels({});
        return;
      }
      const entries = Object.entries(translations.en || {});
      const sourceTexts = entries.map(([, v]) => v);
      try {
        const translated = await translateTextBatch(sourceTexts, language, 'en');
        if (cancelled) return;
        const map = Object.fromEntries(entries.map(([k], i) => [k, translated[i] || translations[language]?.[k] || translations.en[k] || k]));
        setLabels(map);
      } catch (err) {
        if (!cancelled) setLabels({});
      }
    };

    load();
    return () => { cancelled = true; };
  }, [language]);

  useEffect(() => {
    const handler = (e) => {
      const lang = e?.detail?.language || e?.target?.value;
      if (lang) {
        setLanguage(lang);
        void i18n.changeLanguage(lang);
      }
    };
    window.addEventListener('languageChanged', handler);
    return () => window.removeEventListener('languageChanged', handler);
  }, []);

  useEffect(() => {
    if (!language) return;
    try {
      localStorage.setItem('preferredLanguage', language);
    } catch (err) {
      // Ignore storage failures while preserving app behavior.
    }
  }, [language]);

  const setLanguageAndPersist = useCallback((nextLanguage) => {
    const normalized = nextLanguage || 'en';
    setLanguage(normalized);
    void i18n.changeLanguage(normalized);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: normalized } }));
  }, []);

  const t = useCallback((key, options) => {
    const fallbackValue = labels[key] || translations[language]?.[key] || translations.en[key] || key;
    const resolved = i18nT(key, { defaultValue: fallbackValue, ...options }) || fallbackValue;
    if (typeof resolved === 'string' && options) {
      return resolved.replace(/\{(\w+)\}/g, (_, token) => options[token] ?? `{${token}}`);
    }
    return resolved;
  }, [i18nT, labels, language]);

  const value = useMemo(() => ({
    language,
    setLanguage: setLanguageAndPersist,
    t,
    options: getSupportedLanguageOptions(),
  }), [language, setLanguageAndPersist, t]);

  useEffect(() => {
    // expose debug helpers to the window for quick inspection during development
    try {
      window.__getTranslationState = () => ({ language, labels });
      window.__setLanguage = (lang) => setLanguageAndPersist(lang);
    } catch (err) {
      // ignore in non-browser environments
    }
    return () => {
      try {
        delete window.__getTranslationState;
        delete window.__setLanguage;
      } catch (err) {}
    };
  }, [language, labels, setLanguageAndPersist]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationContext;
