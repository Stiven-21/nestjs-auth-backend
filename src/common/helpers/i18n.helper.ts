import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/common/generated/i18n.generated';

export const tm = (
  key: keyof I18nTranslations | string,
  args: Record<string, any> = {},
) => {
  return i18nValidationMessage<I18nTranslations>(key as any, args);
};
