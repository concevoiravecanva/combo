import React from 'react';
import { IntlProvider } from 'react-intl';
import { messages as baseMessages } from './messages';

interface Props {
  children: React.ReactNode;
}

function detectLocale(): string {
  // Canva usually provides a locale code. Fallback en.
  const l =
    (window as any)?.canva?.intl?.locale ||
    navigator.language ||
    'en';
  // Keep only supported locales (simplified)
  const supported = [
    'en', 'fr-FR', 'de-DE', 'es-ES', 'es-419', 'pt-BR', 'tr-TR', 'ja-JP', 'ko-KR', 'id-ID'
  ];

  if (supported.includes(l)) return l;
  const short = l.split('-')[0];
  const map: Record<string, string> = {
    fr: 'fr-FR', de: 'de-DE', es: 'es-ES', pt: 'pt-BR', tr: 'tr-TR',
    ja: 'ja-JP', ko: 'ko-KR', id: 'id-ID'
  };
  return map[short] || 'en';
}

export const AppIntlProvider: React.FC<Props> = ({ children }) => {
  const locale = detectLocale();
  // Initial phase: use defaultMessage only -> empty messages object (translations injected later)
  return (
    <IntlProvider
      locale={locale}
      defaultLocale="en"
      messages={{}} 
    >
      {children}
    </IntlProvider>
  );
};