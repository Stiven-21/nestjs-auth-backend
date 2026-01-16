import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError } from 'src/common/exceptions';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: any,
    i18n: I18nContext,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: {
          ...context,
          appName: process.env.NAME_APP,
        },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({
        i18n,
        lang: i18n.lang,
      });
    }
  }
}
