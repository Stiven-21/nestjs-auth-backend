import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-github2';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import githubOauthConfig from 'src/config/github-oauth.config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(githubOauthConfig.KEY)
    private githubConfig: ConfigType<typeof githubOauthConfig>,
  ) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    return {
      provider: OAuthProviderEnum.GITHUB,
      providerId: profile.id,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      name: profile.username,
      lastname: '',
      isActive: profile.emails[0].verified ?? true,
    };
  }
}
