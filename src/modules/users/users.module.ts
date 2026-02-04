import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { UsersController } from 'src/modules/users/users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { IdentityType } from 'src/modules/users/entities/identity-type.entity';
import { IdentityTypesController } from 'src/modules/users/identity-types/identity-types.controller';
import { IdentityTypesService } from 'src/modules/users/identity-types/identity-types.service';
import { UserToken } from 'src/modules/users/entities/user-tokens.entity';
import { TokensService } from 'src/modules/users/tokens/tokens.service';
import { TokensController } from 'src/modules/users/tokens/tokens.controller';
import { RolesModule } from 'src/modules/roles/roles.module';
import { SessionService } from 'src/modules/users/session/session.service';
import { SessionController } from 'src/modules/users/session/session.controller';
import { UserSession } from 'src/modules/users/entities/user-session.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserAccountOAuth } from 'src/modules/users/entities/user-account-oauth.entity';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { UserAccountCredentials } from 'src/modules/users/entities/user-account-credentials.entity';
import { CredentialsController } from 'src/modules/users/credentials/credentials.controller';
import { CredentialsService } from 'src/modules/users/credentials/credentials.service';
import { UserSecurity } from 'src/modules/users/entities/user-security.entity';
import { SecurityController } from 'src/modules/users/security/security.controller';
import { SecurityService } from 'src/modules/users/security/security.service';
import { UserEmailChangeLog } from 'src/modules/users/entities/user-email-change-log.entity';
import { EmailLogChangesService } from 'src/modules/users/email-log-changes/email-log-changes.service';
import { EmailLogChangesController } from 'src/modules/users/email-log-changes/email-log-changes.controller';
import { UserSecurityRecoveryCodes } from 'src/modules/users/entities/user-security-recovery-codes.entity';
import { SecurityRecoveryCodesService } from 'src/modules/users/security-recovery-codes/security-recovery-codes.service';
import { SecurityRecoveryCodesController } from 'src/modules/users/security-recovery-codes/security-recovery-codes.controller';
import { TotpService } from 'src/modules/users/security/totp/totp.service';
import { UserSecurityTwoFactorOtps } from 'src/modules/users/entities/user-security-two-factor-otps.entity';
import { OtpsService } from 'src/modules/users/security/otps/otps.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      IdentityType,
      UserToken,
      UserSession,
      UserAccountOAuth,
      UserAccountCredentials,
      UserEmailChangeLog,
      UserSecurity,
      UserSecurityRecoveryCodes,
      UserSecurityTwoFactorOtps,
    ]),
    forwardRef(() => AuthModule),
    RolesModule,
    AuditLogModule,
  ],
  controllers: [
    UsersController,
    IdentityTypesController,
    TokensController,
    SessionController,
    CredentialsController,
    SecurityController,
    EmailLogChangesController,
    SecurityRecoveryCodesController,
  ],
  providers: [
    UsersService,
    IdentityTypesService,
    TokensService,
    SessionService,
    OAuthService,
    CredentialsService,
    SecurityService,
    EmailLogChangesService,
    SecurityRecoveryCodesService,
    TotpService,
    OtpsService,
  ],
  exports: [
    TypeOrmModule,
    UsersService,
    TokensService,
    SessionService,
    OAuthService,
    CredentialsService,
    SecurityService,
    EmailLogChangesService,
    SecurityRecoveryCodesService,
    TotpService,
    OtpsService,
  ],
})
export class UsersModule {}
