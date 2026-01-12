'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';

type Language = 'en' | 'es' | 'pt';

interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'pt',
    label: 'Portuguese',
    nativeLabel: 'Português',
    flag: '🇧🇷',
  },
];

interface LanguageSwitcherProps {
  currentLanguage?: Language;
  onLanguageChange?: (language: Language) => void;
  variant?: 'dropdown' | 'compact';
}

export function LanguageSwitcher({
  currentLanguage = 'en',
  onLanguageChange,
  variant = 'dropdown',
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(currentLanguage);

  const currentLangOption = LANGUAGES.find((lang) => lang.code === selectedLang);

  const handleLanguageChange = (language: Language) => {
    // Only English is available currently
    if (language !== 'en') {
      alert('Spanish and Portuguese translations are coming soon! Please check back later.');
      setIsOpen(false);
      return;
    }

    setSelectedLang(language);
    setIsOpen(false);

    // Call the callback if provided
    if (onLanguageChange) {
      onLanguageChange(language);
    }
    // No navigation needed for English since it's the default
  };

  if (variant === 'compact') {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
          aria-label="Change language"
          aria-expanded={isOpen}
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">{currentLangOption?.flag} {currentLangOption?.code.toUpperCase()}</span>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-20">
              <div className="py-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                      lang.code === selectedLang ? 'bg-muted font-semibold' : ''
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.nativeLabel}</span>
                    {lang.code === selectedLang && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <Globe className="h-5 w-5" />
        <div className="text-left">
          <div className="text-xs text-muted-foreground">Language</div>
          <div className="font-medium flex items-center gap-1">
            <span>{currentLangOption?.flag}</span>
            <span>{currentLangOption?.nativeLabel}</span>
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs text-muted-foreground mb-2 px-2">Select Language</div>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-3 ${
                    lang.code === selectedLang ? 'bg-muted' : ''
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{lang.nativeLabel}</div>
                    <div className="text-xs text-muted-foreground">{lang.label}</div>
                  </div>
                  {lang.code === selectedLang && (
                    <span className="text-primary font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Biblical content will be displayed in your selected language using verified translations.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact Language Toggle (for mobile header)
 */
export function LanguageToggle({ currentLanguage = 'en' }: { currentLanguage?: Language }) {
  return <LanguageSwitcher currentLanguage={currentLanguage} variant="compact" />;
}

/**
 * Get translation IDs for Bolls Bible API
 */
export function getBollsTranslationId(language: Language): string {
  const translationMap: Record<Language, string> = {
    en: 'kjv', // King James Version (English)
    es: 'rv1909', // Reina Valera 1909 (Spanish)
    pt: 'almeida', // João Ferreira de Almeida (Portuguese)
  };

  return translationMap[language];
}

/**
 * Get available translations for a language
 */
export function getAvailableTranslations(language: Language): Array<{ id: string; name: string }> {
  const translations: Record<Language, Array<{ id: string; name: string }>> = {
    en: [
      { id: 'kjv', name: 'King James Version' },
      { id: 'web', name: 'World English Bible' },
      { id: 'asv', name: 'American Standard Version' },
      { id: 'bbe', name: 'Bible in Basic English' },
      { id: 'ylt', name: "Young's Literal Translation" },
    ],
    es: [
      { id: 'rv1909', name: 'Reina Valera 1909' },
      { id: 'rv1960', name: 'Reina Valera 1960' },
      { id: 'lbla', name: 'La Biblia de las Américas' },
    ],
    pt: [
      { id: 'almeida', name: 'João Ferreira de Almeida' },
      { id: 'arc', name: 'Almeida Revista e Corrigida' },
      { id: 'nvi-pt', name: 'Nova Versão Internacional' },
    ],
  };

  return translations[language] || translations.en;
}
