import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import facebookOauthConfig from 'src/config/facebook-oauth.config';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class FaceebookStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(facebookOauthConfig.KEY)
    private facebookConfig: ConfigType<typeof facebookOauthConfig>,
    private readonly usersService: UsersService,
    private readonly oauthService: OAuthService,
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
    const user = await this.usersService.validateFacebookUser(
      {
        facebookId: profile.id,
        email: profile.emails[0].value,
        name: profile.name.givenName,
        lastname: profile.name.familyName,
        avatar: profile.photos[0].value,
      },
      null,
    );

    await this.oauthService.create({
      userId: Number(user.id),
      provider: OAuthProviderEnum.FACEBOOK,
      providerId: profile.id,
      isActive: profile.emails[0].verified,
      avatar: profile.photos[0].value,
    });

    done(null, user);
  }
}
