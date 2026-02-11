import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSecurityRecoveryCodes } from 'src/modules/users/entities/user-security-recovery-codes.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { I18nContext } from 'nestjs-i18n';
import { SecurityService } from 'src/modules/users/security/security.service';
import { internalServerError, okResponse } from 'src/common/exceptions';
import * as crypto from 'crypto';
import { UseSecurityRecoveryCodeDto } from 'src/modules/users/dto/use-security-recovery-code.dto';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

@Injectable()
export class SecurityRecoveryCodesService {
  private readonly logger = new Logger(SecurityRecoveryCodesService.name);

  constructor(
    @InjectRepository(UserSecurityRecoveryCodes)
    private readonly securityRecoveryCodesRepository: Repository<UserSecurityRecoveryCodes>,
    private readonly usersService: UsersService,
    private readonly securityService: SecurityService,
  ) {}

  async generate(userId: number, i18n: I18nContext) {
    const user = await this.usersService.findById(userId, i18n);
    const userSecurity = await this.securityService.findOneByUser(user, i18n);

    if (!userSecurity.twoFactorEnabled)
      ResponseFactory.error({
        i18n,
        lang: i18n.lang,
        code: 'TWO_FACTOR_NOT_ENABLED',
      });

    await this.securityRecoveryCodesRepository.delete({
      userSecurity: { id: userSecurity.id },
    });

    const count = 10;

    const codes = Array.from({ length: count }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    const entities = codes.map((code) => {
      const entity = new UserSecurityRecoveryCodes();
      entity.code = code;
      entity.userSecurity = userSecurity;
      return entity;
    });

    try {
      await this.securityRecoveryCodesRepository.save(entities);
      return okResponse({
        data: codes,
        meta: { total: count },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async useCode(
    userId: number,
    useSecurityRecoveryCodeDto: UseSecurityRecoveryCodeDto,
    i18n: I18nContext,
  ) {
    const user = await this.usersService.findById(userId, i18n);
    const userSecurity = await this.securityService.findOneByUser(user, i18n);
    const { code } = useSecurityRecoveryCodeDto;

    const recoveryCode = await this.securityRecoveryCodesRepository.findOne({
      where: { code: code.trim(), userSecurity: { id: userSecurity.id } },
      relations: ['userSecurity'],
    });

    if (!recoveryCode) return false;

    if (recoveryCode.used) return false;

    recoveryCode.used = true;
    try {
      await this.securityRecoveryCodesRepository.save(recoveryCode);
      return true;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
