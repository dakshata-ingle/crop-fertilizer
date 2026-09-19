import { translations } from '../constants/translations.js';

const LIBRE_TRANSLATE_URL = 'https://libretranslate.de/translate';
const DEFAULT_TIMEOUT_MS = 4000;
const FALLBACK_LANGUAGE = 'en';

const normalizeLanguage = (language) => {
  if (!language) return FALLBACK_LANGUAGE;
  const normalized = String(language).trim().toLowerCase();
  const aliasMap = {
    en: 'en',
    hi: 'hi',
    hindi: 'hi',
    ta: 'ta',
    tamil: 'ta',
    te: 'te',
    telugu: 'te',
    kn: 'kn',
    kannada: 'kn',
    ml: 'ml',
    malayalam: 'ml',
    bn: 'bn',
    bengali: 'bn',
    gu: 'gu',
    gujarati: 'gu',
    mr: 'mr',
    marathi: 'mr',
    pa: 'pa',
    punjabi: 'pa',
    ur: 'ur',
    urdu: 'ur',
    as: 'as',
    assamese: 'as',
    or: 'or',
    odia: 'or',
  };
  return aliasMap[normalized] || normalized;
};

const getCachedTranslations = () => {
  if (typeof window === 'undefined') return {};
  return window.__translationCache || (window.__translationCache = {});
};

const setCachedTranslation = (source, target, value, text) => {
  if (typeof window === 'undefined') return;
  const cache = getCachedTranslations();
  const key = `${source}:${target}`;
  cache[key] = { ...(cache[key] || {}), [text]: value };
};

const getCachedTranslation = (source, target, text) => {
  if (typeof window === 'undefined') return null;
  return getCachedTranslations()[`${source}:${target}`]?.[text] || null;
};

const buildController = () => {
  if (typeof AbortController === 'undefined') return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  return { controller, timeoutId };
};

export const translateText = async (text, targetLanguage, sourceLanguage = 'auto') => {
  const normalizedTarget = normalizeLanguage(targetLanguage);
  const normalizedSource = normalizeLanguage(sourceLanguage);

  if (!text || typeof text !== 'string' || !normalizedTarget || normalizedTarget === FALLBACK_LANGUAGE) {
    return { translatedText: text, usedFallback: normalizedTarget !== FALLBACK_LANGUAGE, sourceLanguage: normalizedSource, targetLanguage: normalizedTarget };
  }

  if (normalizedTarget === normalizedSource) {
    return { translatedText: text, usedFallback: false, sourceLanguage: normalizedSource, targetLanguage: normalizedTarget };
  }

  const cached = getCachedTranslation(normalizedSource, normalizedTarget, text);
  if (cached) {
    return { translatedText: cached, usedFallback: false, sourceLanguage: normalizedSource, targetLanguage: normalizedTarget };
  }

  let controllerContext = null;
  try {
    controllerContext = buildController();
    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: [text], source: normalizedSource, target: normalizedTarget, format: 'text' }),
      signal: controllerContext?.controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`Translation request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const translatedText = Array.isArray(payload) ? payload[0]?.translatedText || text : payload?.translatedText || text;
    const result = { translatedText, usedFallback: false, sourceLanguage: normalizedSource, targetLanguage: normalizedTarget };
    setCachedTranslation(normalizedSource, normalizedTarget, translatedText, text);
    return result;
  } catch (error) {
    return { translatedText: text, usedFallback: true, sourceLanguage: normalizedSource, targetLanguage: normalizedTarget, error: error.message };
  } finally {
    if (controllerContext?.timeoutId) clearTimeout(controllerContext.timeoutId);
  }
};

export const translateTextBatch = async (texts, targetLanguage, sourceLanguage = 'auto') => {
  const normalizedTarget = normalizeLanguage(targetLanguage);
  const normalizedSource = normalizeLanguage(sourceLanguage);
  if (!Array.isArray(texts) || texts.length === 0 || normalizedTarget === FALLBACK_LANGUAGE) {
    return texts || [];
  }

  if (normalizedTarget === normalizedSource) {
    return texts;
  }

  try {
    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, source: normalizedSource, target: normalizedTarget, format: 'text' }),
    });

    if (!response.ok) {
      throw new Error(`Translation request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const translatedValues = Array.isArray(payload)
      ? payload.map((item) => item?.translatedText || item?.[0]?.translatedText || '')
      : [];

    return translatedValues.length === texts.length
      ? translatedValues.map((value) => value || '')
      : texts.map((text) => text);
  } catch (error) {
    return texts;
  }
};

export const translateWithFallback = async (text, targetLanguage, sourceLanguage = 'auto') => {
  const result = await translateText(text, targetLanguage, sourceLanguage);
  return result.translatedText;
};

export const getSupportedLanguageOptions = () => [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'ml', label: 'മലയാളം (Malayalam)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'ur', label: 'اُردُو (Urdu)' },
  { value: 'as', label: 'অসমীয়া (Assamese)' },
  { value: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
];

export const translateKey = (key, targetLanguage) => {
  const normalizedTarget = normalizeLanguage(targetLanguage);
  const languageBundle = translations[normalizedTarget] || translations[FALLBACK_LANGUAGE];
  return languageBundle[key] || translations[FALLBACK_LANGUAGE][key] || key;
};

export const getTranslationLocale = (language) => normalizeLanguage(language);
