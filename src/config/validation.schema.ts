import * as Joi from 'joi';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from 'src/common/constants/i18n.constants';

export const validationSchema = Joi.object({
  // ===============================
  // APP
  // ===============================
  APP_NAME: Joi.string().default('NestAuth'),
  APP_PORT: Joi.number().default(8000),
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),

  URL_FRONTEND: Joi.string().uri().required(),

  // ===============================
  // DATABASE
  // ===============================
  DB_TYPE: Joi.string().valid('postgres').default('postgres'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),

  // ===============================
  // LANGUAGE
  // ===============================
  I18N_FALLBACK_LANGUAGE: Joi.string()
    .valid(...SUPPORTED_LANGUAGES)
    .default(DEFAULT_LANGUAGE),

  // ===============================
  // JWT
  // ===============================
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('2d'),

  // ===============================
  // MAIL (required)
  // ===============================
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_SECURE: Joi.boolean().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),
  DEFAULT_REMITTER_MAIL: Joi.string().email().required(),

  // ===============================
  // OAUTH (required)
  // ===============================
  OAUTH_STATE_SECRET: Joi.string().required(),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

  FACEBOOK_APP_ID: Joi.string().required(),
  FACEBOOK_APP_SECRET: Joi.string().required(),
  FACEBOOK_CALLBACK_URL: Joi.string().uri().required(),

  GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),
  GITHUB_CALLBACK_URL: Joi.string().uri().required(),

  //  ===============================
  //  ROL USER AND PERMISSION DEFAULT
  //  ===============================
  ROL_USER_DEFAULT: Joi.string().default('user'),
  ROL_PERMISSION_DEFAULT: Joi.string().default(
    'users:update:id, users:delete:id',
  ),

  // ===============================
  // FRONTEND PATHS (optional)
  // ===============================
  FRONTEND_LOGIN_PATH: Joi.string().default('/auth/login'),
  FRONTEND_DASHBOARD_PATH: Joi.string().default('/dashboard'),
  FRONTEND_CHANGE_PASSWORD_PATH: Joi.string().default('/change-password'),
  FRONTEND_EMAIL_ROLLBACK_PATH: Joi.string().default(
    '/email-change-request/rollback',
  ),
  FRONTEND_AUTH_CALLBACK_PATH: Joi.string().default('/auth/callback'),
}) // MAIL: si existe uno → deben existir todos
  .and(
    'MAIL_HOST',
    'MAIL_PORT',
    'MAIL_SECURE',
    'MAIL_USER',
    'MAIL_PASSWORD',
    'DEFAULT_REMITTER_MAIL',
  )

  // GOOGLE: si existe uno → deben existir todos
  .and('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL')

  // FACEBOOK: si existe uno → deben existir todos
  .and('FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_CALLBACK_URL')

  // GITHUB: si existe uno → deben existir todos
  .and('GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_CALLBACK_URL');
