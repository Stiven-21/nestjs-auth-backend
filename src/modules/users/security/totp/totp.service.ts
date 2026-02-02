import { Injectable, Logger } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { SecurityService } from 'src/modules/users/security/security.service';
import { I18nContext } from 'nestjs-i18n';
import { UsersService } from 'src/modules/users/users.service';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';
import { UserSecurity } from 'src/modules/users/entities/user-security.entity';

@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);
  constructor(
    private readonly securityService: SecurityService,
    private readonly usersService: UsersService,
  ) {}

  async generateSecret(userId: number, email: string, i18n: I18nContext) {
    const { data: user } = await this.usersService.findById(userId, i18n);
    const userSecurity = await this.securityService.findOneByUser(user, i18n);

    const secret = speakeasy.generateSecret({
      name: `${process.env.NAME_APP} (${email})`,
      length: 20,
    });

    userSecurity.twoFactorData = { secret: secret.base32 };
    await this.securityService.save(userSecurity, i18n);

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
    };
  }

  async generateQrCode(otpauth_url: string) {
    return await QRCode.toDataURL(otpauth_url);
  }

  async verifyToken(secret: string, token: string) {
    this.logger.log({ secret, token });
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async enableTotp(
    email: string,
    userSecurity: UserSecurity,
    i18n: I18nContext,
  ) {
    const secret = speakeasy.generateSecret({
      name: `${process.env.NAME_APP} (${email})`,
    });
    userSecurity.twoFactorEnabled = false;
    userSecurity.twoFactorType = TwoFactorType.TOTP;
    userSecurity.twoFactorData = {
      secret,
      pending: true,
    };
    await this.securityService.save(userSecurity, i18n);
    return {
      qrCode: await QRCode.toDataURL(secret.otpauth_url),
    };
  }
}
