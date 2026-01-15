import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import githubOauthConfig from 'src/config/github-oauth.config';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(githubOauthConfig.KEY)
    private githubConfig: ConfigType<typeof githubOauthConfig>,
    private readonly usersService: UsersService,
    private readonly oauthService: OAuthService,
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
    const user = await this.usersService.validateGithubUser(
      {
        githubId: profile.id,
        email: profile.emails[0].value,
        name: profile.username,
        lastname: '',
        avatar: profile.photos[0].value,
      },
      null,
    );

    await this.oauthService.create({
      userId: Number(user.id),
      provider: OAuthProviderEnum.GITHUB,
      providerId: profile.id,
      isActive: profile.emails[0].verified,
      avatar: profile.photos[0].value,
    });

    done(null, user);
  }
}

// {
//   profile: {
//     id: '61439523',
//     nodeId: 'MDQ6VXNlcjYxNDM5NTIz',
//     displayName: null,
//     username: 'Stiven-21',
//     profileUrl: 'https://github.com/Stiven-21',
//     photos: [ [Object] ],
//     provider: 'github',
//     _raw: '{"login":"Stiven-21","id":61439523,"node_id":"MDQ6VXNlcjYxNDM5NTIz","avatar_url":"https://avatars.githubusercontent.com/u/61439523?v=4","gravatar_id":"","url":"https://api.github.com/users/Stiven-21","html_url":"https://github.com/Stiven-21","followers_url":"https://api.github.com/users/Stiven-21/followers","following_url":"https://api.github.com/users/Stiven-21/following{/other_user}","gists_url":"https://api.github.com/users/Stiven-21/gists{/gist_id}","starred_url":"https://api.github.com/users/Stiven-21/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/Stiven-21/subscriptions","organizations_url":"https://api.github.com/users/Stiven-21/orgs","repos_url":"https://api.github.com/users/Stiven-21/repos","events_url":"https://api.github.com/users/Stiven-21/events{/privacy}","received_events_url":"https://api.github.com/users/Stiven-21/received_events","type":"User","user_view_type":"public","site_admin":false,"name":null,"company":null,"blog":"","location":null,"email":null,"hireable":null,"bio":null,"twitter_username":null,"notification_email":null,"public_repos":21,"public_gists":0,"followers":2,"following":0,"created_at":"2020-02-25T00:16:46Z","updated_at":"2026-01-14T22:19:33Z"}',
//     _json: {
//       login: 'Stiven-21',
//       id: 61439523,
//       node_id: 'MDQ6VXNlcjYxNDM5NTIz',
//       avatar_url: 'https://avatars.githubusercontent.com/u/61439523?v=4',
//       gravatar_id: '',
//       url: 'https://api.github.com/users/Stiven-21',
//       html_url: 'https://github.com/Stiven-21',
//       followers_url: 'https://api.github.com/users/Stiven-21/followers',
//       following_url: 'https://api.github.com/users/Stiven-21/following{/other_user}',
//       gists_url: 'https://api.github.com/users/Stiven-21/gists{/gist_id}',
//       starred_url: 'https://api.github.com/users/Stiven-21/starred{/owner}{/repo}',
//       subscriptions_url: 'https://api.github.com/users/Stiven-21/subscriptions',
//       organizations_url: 'https://api.github.com/users/Stiven-21/orgs',
//       repos_url: 'https://api.github.com/users/Stiven-21/repos',
//       events_url: 'https://api.github.com/users/Stiven-21/events{/privacy}',
//       received_events_url: 'https://api.github.com/users/Stiven-21/received_events',
//       type: 'User',
//       user_view_type: 'public',
//       site_admin: false,
//       name: null,
//       company: null,
//       blog: '',
//       location: null,
//       email: null,
//       hireable: null,
//       bio: null,
//       twitter_username: null,
//       notification_email: null,
//       public_repos: 21,
//       public_gists: 0,
//       followers: 2,
//       following: 0,
//       created_at: '2020-02-25T00:16:46Z',
//       updated_at: '2026-01-14T22:19:33Z'
//     },
//     emails: [ [Object] ]
//   }
// }
// {
//   profile: {
//     id: '61439523',
//     nodeId: 'MDQ6VXNlcjYxNDM5NTIz',
//     displayName: null,
//     username: 'Stiven-21',
//     profileUrl: 'https://github.com/Stiven-21',
//     photos: [ [Object] ],
//     provider: 'github',
//     _raw: '{"login":"Stiven-21","id":61439523,"node_id":"MDQ6VXNlcjYxNDM5NTIz","avatar_url":"https://avatars.githubusercontent.com/u/61439523?v=4","gravatar_id":"","url":"https://api.github.com/users/Stiven-21","html_url":"https://github.com/Stiven-21","followers_url":"https://api.github.com/users/Stiven-21/followers","following_url":"https://api.github.com/users/Stiven-21/following{/other_user}","gists_url":"https://api.github.com/users/Stiven-21/gists{/gist_id}","starred_url":"https://api.github.com/users/Stiven-21/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/Stiven-21/subscriptions","organizations_url":"https://api.github.com/users/Stiven-21/orgs","repos_url":"https://api.github.com/users/Stiven-21/repos","events_url":"https://api.github.com/users/Stiven-21/events{/privacy}","received_events_url":"https://api.github.com/users/Stiven-21/received_events","type":"User","user_view_type":"public","site_admin":false,"name":null,"company":null,"blog":"","location":null,"email":null,"hireable":null,"bio":null,"twitter_username":null,"notification_email":null,"public_repos":21,"public_gists":0,"followers":2,"following":0,"created_at":"2020-02-25T00:16:46Z","updated_at":"2026-01-14T22:19:33Z"}',
//     _json: {
//       login: 'Stiven-21',
//       id: 61439523,
//       node_id: 'MDQ6VXNlcjYxNDM5NTIz',
//       avatar_url: 'https://avatars.githubusercontent.com/u/61439523?v=4',
//       gravatar_id: '',
//       url: 'https://api.github.com/users/Stiven-21',
//       html_url: 'https://github.com/Stiven-21',
//       followers_url: 'https://api.github.com/users/Stiven-21/followers',
//       following_url: 'https://api.github.com/users/Stiven-21/following{/other_user}',
//       gists_url: 'https://api.github.com/users/Stiven-21/gists{/gist_id}',
//       starred_url: 'https://api.github.com/users/Stiven-21/starred{/owner}{/repo}',
//       subscriptions_url: 'https://api.github.com/users/Stiven-21/subscriptions',
//       organizations_url: 'https://api.github.com/users/Stiven-21/orgs',
//       repos_url: 'https://api.github.com/users/Stiven-21/repos',
//       events_url: 'https://api.github.com/users/Stiven-21/events{/privacy}',
//       received_events_url: 'https://api.github.com/users/Stiven-21/received_events',
//       type: 'User',
//       user_view_type: 'public',
//       site_admin: false,
//       name: null,
//       company: null,
//       blog: '',
//       location: null,
//       email: null,
//       hireable: null,
//       bio: null,
//       twitter_username: null,
//       notification_email: null,
//       public_repos: 21,
//       public_gists: 0,
//       followers: 2,
//       following: 0,
//       created_at: '2020-02-25T00:16:46Z',
//       updated_at: '2026-01-14T22:19:33Z'
//     },
//     emails: [ [Object] ]
//   }
// }
