import { registerAs } from '@nestjs/config';

export default registerAs('facebookOAuth', () => ({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
}));
