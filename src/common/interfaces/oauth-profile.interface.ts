import { OAuthProviderEnum } from '../enum/user-oauth-providers.enum';

export type OAuthProfile = {
  provider: OAuthProviderEnum;
  providerId: string;
  email: string;
  avatar: string;
  name: string;
  lastname: string;
  isActive: boolean;
};
