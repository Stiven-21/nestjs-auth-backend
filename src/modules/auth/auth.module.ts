import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/modules/auth/auth.service';
import { AuthController } from 'src/modules/auth/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/modules/users/users.module';
import googleOauthConfig from 'src/config/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import facebookOauthConfig from 'src/config/facebook-oauth.config';
import { FaceebookStrategy } from './strategies/faceebook.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async () => ({
        global: true,
      }),
    }),
    ConfigModule.forFeature(googleOauthConfig),
    ConfigModule.forFeature(facebookOauthConfig),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, FaceebookStrategy],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
