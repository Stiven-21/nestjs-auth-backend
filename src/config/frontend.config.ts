import { registerAs } from '@nestjs/config';

export default registerAs('frontend', () => ({
  url: process.env.URL_FRONTEND,

  paths: {
    login: process.env.FRONTEND_LOGIN_PATH || '/auth/login',
    dashboard: process.env.FRONTEND_DASHBOARD_PATH || '/dashboard',
    changePassword:
      process.env.FRONTEND_CHANGE_PASSWORD_PATH || '/profile/change-password',
    emailRollback:
      process.env.FRONTEND_EMAIL_ROLLBACK_PATH ||
      '/email-change-request/rollback/',
    authCallback: process.env.FRONTEND_AUTH_CALLBACK_PATH || '/auth/callback',
  },
}));
