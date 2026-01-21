import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import facebookOauthConfig from 'src/config/facebook-oauth.config';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { UsersService } from 'src/modules/users/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(FacebookStrategy.name);
  constructor(
    @Inject(facebookOauthConfig.KEY)
    private facebookConfig: ConfigType<typeof facebookOauthConfig>,
    private readonly usersService: UsersService,
    private readonly oauthService: OAuthService,
    private readonly dataSource: DataSource,
  ) {
    super({
      clientID: facebookConfig.clientID,
      clientSecret: facebookConfig.clientSecret,
      callbackURL: facebookConfig.callbackURL,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {
    const user = this.dataSource.transaction(async (manager) => {
      const validateUser = await this.usersService.validateFacebookUser(
        {
          facebookId: profile.id,
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
          provider: OAuthProviderEnum.FACEBOOK,
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
