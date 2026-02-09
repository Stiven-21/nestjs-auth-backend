import { BaseOauthGuard } from 'src/modules/auth/guards/oauth/base-oauth.guard';

export const GithubLinkGuard = BaseOauthGuard('github', 'link');
