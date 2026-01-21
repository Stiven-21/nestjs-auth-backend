import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import githubOauthConfig from 'src/config/github-oauth.config';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { UsersService } from 'src/modules/users/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(githubOauthConfig.KEY)
    private githubConfig: ConfigType<typeof githubOauthConfig>,
    private readonly usersService: UsersService,
    private readonly oauthService: OAuthService,
    private readonly dataSource: DataSource,
  ) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {
    const user = await this.dataSource.transaction(async (manager) => {
      const validateUser = await this.usersService.validateGithubUser(
        {
          githubId: profile.id,
          email: profile.emails[0].value,
          name: profile.username,
          lastname: '',
          avatar: profile.photos[0].value,
        },
        null,
        manager,
      );

      await this.oauthService.create(
        {
          user: validateUser,
          provider: OAuthProviderEnum.GITHUB,
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
