import { registerAs } from '@nestjs/config';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';

export default registerAs('i18n', () => ({
  enabled: process.env.I18N_ENABLED === 'true',
  fallbackLanguage: process.env.I18N_FALLBACK_LANGUAGE || DEFAULT_LANGUAGE,
}));
