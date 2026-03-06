/**
 * i18n Configuration for CIVITAS
 * 
 * Supports multiple languages for developing countries worldwide:
 * - English (en) - Global/Default
 * - Spanish (es) - Latin America
 * - Portuguese (pt) - Brazil, Lusophone Africa
 * - French (fr) - West/Central Africa, Haiti
 * - Arabic (ar) - Middle East, North Africa
 * - Hindi (hi) - India, South Asia
 * - Swahili (sw) - East Africa
 * - Luganda (lg) - Uganda
 * - Hausa (ha) - West Africa
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import sw from './locales/sw.json';
import lg from './locales/lg.json';
import ha from './locales/ha.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  fr: { translation: fr },
  ar: { translation: ar },
  hi: { translation: hi },
  sw: { translation: sw },
  lg: { translation: lg },
  ha: { translation: ha }
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    // Language detection order
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    interpolation: {
      escapeValue: false // React already escapes
    },

    // React options
    react: {
      useSuspense: true
    }
  });

export default i18n;

// Helper to get available languages
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'Global' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'Latin America' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', region: 'Brazil & Africa' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'Africa & Caribbean' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'MENA', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'South Asia' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', region: 'East Africa' },
  { code: 'lg', name: 'Luganda', nativeName: 'Oluganda', flag: '🇺🇬', region: 'Uganda' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', region: 'West Africa' }
];
