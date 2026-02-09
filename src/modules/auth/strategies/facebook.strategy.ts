import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import facebookOauthConfig from 'src/config/facebook-oauth.config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(FacebookStrategy.name);
  constructor(
    @Inject(facebookOauthConfig.KEY)
    private facebookConfig: ConfigType<typeof facebookOauthConfig>,
  ) {
    super({
      clientID: facebookConfig.clientID,
      clientSecret: facebookConfig.clientSecret,
      callbackURL: facebookConfig.callbackURL,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      provider: OAuthProviderEnum.FACEBOOK,
      providerId: profile.id,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      name: profile.name.givenName,
      lastname: profile.name.familyName,
      isActive: profile.emails[0].verified ?? true,
    };
  }
}
