import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSecurityTwoFactorOtps } from 'src/modules/users/entities/user-security-two-factor-otps.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../../entities/user.entity';
import { TwoFactorOtpsType } from 'src/common/enum/two-factor-otps.enum';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError, unauthorizedError } from 'src/common/exceptions';
import { UserSecurity } from '../../entities/user-security.entity';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';
import { SecurityService } from '../security.service';

@Injectable()
export class OtpsService {
  private readonly logger = new Logger(OtpsService.name);

  constructor(
    @InjectRepository(UserSecurityTwoFactorOtps)
    private readonly userSecurityTwoFactorOtpsRepository: Repository<UserSecurityTwoFactorOtps>,
    private readonly userSecurityService: SecurityService,
  ) {}

  private async generateCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  async createOtp(user: User, type: TwoFactorOtpsType, i18n: I18nContext) {
    try {
      await this.userSecurityTwoFactorOtpsRepository.update(
        { user: { id: user.id }, type, used: false },
        { used: true },
      );
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    const code = await this.generateCode();

    try {
      await this.userSecurityTwoFactorOtpsRepository.save({
        user,
        code: crypto.createHash('sha256').update(code).digest('hex'),
        type,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      return code;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async verifyOtps(
    userId: number,
    type: TwoFactorOtpsType,
    code: string,
    i18n: I18nContext,
  ) {
    let otp: UserSecurityTwoFactorOtps | null = null;
    try {
      otp = await this.userSecurityTwoFactorOtpsRepository.findOne({
        where: {
          user: { id: userId },
          type,
          used: false,
        },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!otp || otp.expiresAt < new Date()) return false;
    otp.failedAttempts++;
    if (otp.failedAttempts >= 5) {
      await this.userSecurityTwoFactorOtpsRepository.save(otp);
      unauthorizedError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.twoFactorOtps.blocked', {
          lang: i18n.lang,
        }),
      });
    }
    const hashCode = crypto.createHash('sha256').update(code).digest('hex');
    if (otp.code !== hashCode) return false;
    otp.used = true;
    try {
      await this.userSecurityTwoFactorOtpsRepository.save(otp);
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    return true;
  }

  async enableOtps(user: User, userSecurity: UserSecurity, i18n: I18nContext) {
    userSecurity.twoFactorEnabled = false;
    userSecurity.twoFactorType = TwoFactorType.EMAIL;

    const code = await this.createOtp(user, TwoFactorOtpsType.EMAIL, i18n);

    await this.userSecurityService.save(userSecurity, i18n);

    return code;
  }
}
