import React, { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

const LanguageSwitcher = ({ className = "" }) => {
  const { language, setLanguage } = useContext(LanguageContext);

  return (
    <div className={`inline-flex items-center p-1 bg-white/90 backdrop-blur-md border border-gray-300 rounded-full shadow-sm text-xs font-bold transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${
          language === 'fr'
            ? 'bg-[#0E7A54] text-white shadow-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        aria-label="Français"
      >
        <span>🇫🇷</span>
        <span>FR</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${
          language === 'en'
            ? 'bg-[#0E7A54] text-white shadow-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        aria-label="English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
