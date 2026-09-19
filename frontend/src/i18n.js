import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './constants/translations';

const normalizeLanguageCode = (value) => {
  if (!value) return 'en';
  const normalized = String(value).trim().toLowerCase();
  const baseCode = normalized.split('-')[0];
  if (translations[normalized]) return normalized;
  if (translations[baseCode]) return baseCode;
  return 'en';
};

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    const stored = window.localStorage.getItem('preferredLanguage');
    if (stored) {
      const normalizedStored = normalizeLanguageCode(stored);
      if (normalizedStored !== 'en' || translations[stored]) {
        return normalizedStored;
      }
    }
  } catch (err) {
    // Ignore storage access issues and fall back to defaults.
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLanguageCode(navigator.language);
  }

  return 'en';
};

const resources = Object.fromEntries(
  Object.entries(translations).map(([language, values]) => [language, { translation: values }]),
);

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: Object.keys(translations),
  interpolation: {
    escapeValue: false,
  },
  defaultNS: 'translation',
  ns: ['translation'],
  react: {
    useSuspense: false,
  },
});

export default i18n;
