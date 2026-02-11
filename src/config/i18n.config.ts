import { registerAs } from '@nestjs/config';

export default registerAs('i18n', () => ({
  enabled: process.env.I18N_ENABLED === 'true',
  fallbackLanguage: process.env.I18N_FALLBACK_LANGUAGE || 'en',
}));
