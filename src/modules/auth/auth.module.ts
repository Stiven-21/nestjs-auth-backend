import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/modules/auth/auth.service';
import { AuthController } from 'src/modules/auth/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/modules/users/users.module';
import googleOauthConfig from 'src/config/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import facebookOauthConfig from 'src/config/facebook-oauth.config';
import { FacebookStrategy } from 'src/modules/auth/strategies/facebook.strategy';
import githubOauthConfig from 'src/config/github-oauth.config';
import { GithubStrategy } from 'src/modules/auth/strategies/github.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSessions } from 'src/modules/auth/entities/auth-sessions.entity';
import { AuthRefreshTokens } from 'src/modules/auth/entities/auth-refresh-tokens.entity';
import { AuthSessionsService } from 'src/modules/auth/sessions/sessions.service';
import { AuthRefreshTokensService } from 'src/modules/auth/refresh-tokens/refresh-tokens.service';
import { AttemptsService } from 'src/modules/auth/attempts/attempts.service';
import { AuthAttempts } from 'src/modules/auth/entities/auth-attempts.entity';
import { AuthPasswordPolicy } from 'src/modules/auth/entities/auth-password-policy.entity';
import { PasswordPolicyService } from 'src/modules/auth/password-policy/password-policy.service';
import { PasswordPolicyConstraint } from 'src/common/validator/passwordPolicyConstraint.validator';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async () => ({
        global: true,
      }),
    }),
    TypeOrmModule.forFeature([
      AuthSessions,
      AuthRefreshTokens,
      AuthAttempts,
      AuthPasswordPolicy,
    ]),
    ConfigModule.forFeature(googleOauthConfig),
    ConfigModule.forFeature(facebookOauthConfig),
    ConfigModule.forFeature(githubOauthConfig),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    FacebookStrategy,
    GithubStrategy,
    AuthSessionsService,
    AuthRefreshTokensService,
    AttemptsService,
    PasswordPolicyService,
    PasswordPolicyConstraint,
  ],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
