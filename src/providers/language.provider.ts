import { Injectable } from '@nestjs/common';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';

@Injectable()
export class LanguageProvider {
  private currentLanguage: string = DEFAULT_LANGUAGE;

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  setCurrentLanguage(lang: string): void {
    this.currentLanguage = lang;
  }
}
