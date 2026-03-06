import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for accessing translations
 * Provides convenient access to translation function and i18n instance
 * 
 * @returns {Object} Translation utilities
 * @returns {Function} t - Translation function
 * @returns {Object} i18n - i18n instance for direct access
 * @returns {string} currentLanguage - Current language code
 * @returns {Function} changeLanguage - Function to change language
 */
export const useI18n = () => {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage,
  };
};

export default useI18n;
