import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

type Locale = 'ar' | 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as string | undefined;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const messages = locale === 'ar'
    ? (await import('../../messages/ar.json')).default
    : (await import('../../messages/en.json')).default;

  return {
    locale: locale as Locale,
    messages,
  };
});
