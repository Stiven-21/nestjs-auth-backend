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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      IdentityType,
      UserToken,
      UserSession,
      UserAccountOAuth,
      UserAccountCredentials,
      UserSecurity,
    ]),
    forwardRef(() => AuthModule),
    RolesModule,
  ],
  controllers: [
    UsersController,
    IdentityTypesController,
    TokensController,
    SessionController,
    CredentialsController,
    SecurityController,
  ],
  providers: [
    UsersService,
    IdentityTypesService,
    TokensService,
    SessionService,
    OAuthService,
    CredentialsService,
    SecurityService,
  ],
  exports: [
    TypeOrmModule,
    UsersService,
    TokensService,
    SessionService,
    OAuthService,
    CredentialsService,
    SecurityService,
  ],
})
export class UsersModule {}
