import { Injectable } from '@nestjs/common';
import { DefaultLanguage } from 'src/common/types/languages.types';

@Injectable()
export class LanguageProvider {
  private currentLanguage: string = DefaultLanguage;

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  setCurrentLanguage(lang: string): void {
    this.currentLanguage = lang;
  }
}
