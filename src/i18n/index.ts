import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import tr from './locales/tr.json';

const detector = new LanguageDetector();
detector.addDetector({
  name: 'turkishOrEnglish',
  lookup() {
    const candidates: string[] = [];
    if (typeof navigator !== 'undefined') {
      if (navigator.language) candidates.push(navigator.language);
      if (Array.isArray(navigator.languages)) {
        candidates.push(...navigator.languages);
      }
    }
    const isTurkish = candidates.some(l =>
      typeof l === 'string' && l.toLowerCase().startsWith('tr')
    );
    return isTurkish ? 'tr' : 'en';
  },
});

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'tr'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['turkishOrEnglish'],
      caches: [],
    },
    returnNull: false,
  });

function syncDocumentChrome() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = i18n.language;
  const title = i18n.t('app.title');
  if (title && title !== 'app.title') {
    document.title = title;
  }
}

i18n.on('languageChanged', syncDocumentChrome);
i18n.on('initialized', syncDocumentChrome);
syncDocumentChrome();

export default i18n;
