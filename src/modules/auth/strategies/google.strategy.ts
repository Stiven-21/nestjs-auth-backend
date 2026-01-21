import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import googleOauthConfig from 'src/config/google-oauth.config';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { UsersService } from 'src/modules/users/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(GoogleStrategy.name);
  constructor(
    @Inject(googleOauthConfig.KEY)
    private googleConfig: ConfigType<typeof googleOauthConfig>,
    private readonly usersService: UsersService,
    private readonly oauthService: OAuthService,
    private readonly dataSource: DataSource,
  ) {
    super({
      clientID: googleConfig.clientID,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const user = await this.dataSource.transaction(async (manager) => {
      const validateUser = await this.usersService.validateGoogleUser(
        {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.name.givenName,
          lastname: profile.name.familyName,
          avatar: profile.photos[0].value,
        },
        null,
        manager,
      );

      await this.oauthService.create(
        {
          user: validateUser,
          provider: OAuthProviderEnum.GOOGLE,
          providerId: profile.id,
          isActive: profile.emails[0].verified,
          avatar: profile.photos[0].value,
        },
        manager,
      );

      return validateUser;
    });

    done(null, user);
  }
}
