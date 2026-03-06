import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../i18n/config';
import './LanguageSelector.css';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    const selectedLang = languages.find(lang => lang.code === langCode);
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    localStorage.setItem('i18nextLng', langCode);
    
    // Set HTML dir attribute for RTL languages
    if (selectedLang?.rtl) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  };

  // Set initial direction on mount
  useEffect(() => {
    if (currentLanguage?.rtl) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [currentLanguage]);

  return (
    <div className="language-selector">
      <button 
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
      >
        <span className="flag">{currentLanguage.flag}</span>
        <span className="language-name">{currentLanguage.nativeName}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="language-overlay" 
            onClick={() => setIsOpen(false)}
          />
          <div className="language-dropdown">
            {languages.map(language => (
              <button
                key={language.code}
                className={`language-option ${
                  language.code === i18n.language ? 'active' : ''
                }`}
                onClick={() => changeLanguage(language.code)}
              >
                <span className="flag">{language.flag}</span>
                <div className="language-info">
                  <span className="native-name">{language.nativeName}</span>
                  <span className="english-name">{language.name} • {language.region}</span>
                </div>
                {language.code === i18n.language && (
                  <span className="checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
