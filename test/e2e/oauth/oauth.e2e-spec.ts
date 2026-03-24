/* eslint-disable */
// Load .env.test file first
import { config } from 'dotenv';
config({ path: '.env.test' });

// Mock bcryptjs to avoid hashing/comparison issues in e2e tests
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$mockhashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));
// @ts-ignore - bcrypt types may not be available
import * as bcrypt from 'bcryptjs';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpException } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

// Declare AppModule for dynamic import
let AppModule: any;
import { ThrottlerGuard } from '@nestjs/throttler';
import { useContainer } from 'class-validator';
import { CustomValidationPipe } from '../../../src/config/validation.config';
import { MailService } from '../../../src/mails/mail.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { CredentialsService } from '../../../src/modules/users/credentials/credentials.service';
import { TokensService } from '../../../src/modules/users/tokens/tokens.service';
import { SecurityService } from '../../../src/modules/users/security/security.service';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../../src/modules/users/session/session.service';
import { AuthSessionsService } from '../../../src/modules/auth/sessions/sessions.service';
import { AuthRefreshTokensService } from '../../../src/modules/auth/refresh-tokens/refresh-tokens.service';
import { AttemptsService } from '../../../src/modules/auth/attempts/attempts.service';
import { AuditLogService } from '../../../src/modules/audit-log/audit-log.service';
import { TotpService } from '../../../src/modules/users/security/totp/totp.service';
import { OtpsService } from '../../../src/modules/users/security/otps/otps.service';
import { UserTokenEnum } from '../../../src/common/enum/user-token.enum';
import { User } from '../../../src/modules/users/entities/user.entity';
import { UserToken } from '../../../src/modules/users/entities/user-tokens.entity';
import { AuthSessions } from '../../../src/modules/auth/entities/auth-sessions.entity';
import { AuthRefreshTokens } from '../../../src/modules/auth/entities/auth-refresh-tokens.entity';
import { UserSecurity } from '../../../src/modules/users/entities/user-security.entity';
import { AuthReAuthToken } from '../../../src/modules/auth/entities/auth-reauth-token.entity';
import { UserSession } from '../../../src/modules/users/entities/user-session.entity';
import { UserAccountOAuth } from '../../../src/modules/users/entities/user-account-oauth.entity';
import { UserAccountCredentials } from '../../../src/modules/users/entities/user-account-credentials.entity';
import { UserEmailChangeLog } from '../../../src/modules/users/entities/user-email-change-log.entity';
import { UserEmailChangeRequest } from '../../../src/modules/users/entities/user-email-change-request.entity';
import { UserSecurityTwoFactorOtps } from '../../../src/modules/users/entities/user-security-two-factor-otps.entity';
import { OAuthService } from '../../../src/modules/users/oauth/oauth.service';

// Mock parcial del módulo net: preservamos Socket y otras propiedades, solo sobreescribimos isIP
jest.mock('net', () => {
  const actualNet = jest.requireActual('net');
  return {
    ...actualNet,
    isIP: jest.fn().mockReturnValue(true),
  };
});

// Mock del helper de request info para evitar uso de net
jest.mock('src/common/helpers/request-info.helper', () => ({
  getClientInfo: jest.fn(() => ({ ip: '127.0.0.1', userAgent: 'test' })),
  getIPFromRequest: jest.fn(() => '127.0.0.1'),
}));

// Mock completo de AttemptsService
jest.mock('../../../src/modules/auth/attempts/attempts.service', () => {
  return {
    AttemptsService: jest.fn().mockImplementation(() => ({
      recordFailure: jest.fn().mockResolvedValue({}),
      reset: jest.fn().mockResolvedValue({}),
      findEmail: jest
        .fn()
        .mockResolvedValue({ failures: 0, lockedUntil: null }),
    })),
  };
});

// Mock de SecurityService para crear user_security correctamente
jest.mock('../../../src/modules/users/security/security.service', () => {
  return {
    SecurityService: jest.fn().mockImplementation(() => ({
      create: jest
        .fn()
        .mockImplementation(async (dto: any, _i18n?: any, manager?: any) => {
          if (!manager || typeof manager.query !== 'function') {
            throw new Error('SecurityService mock: manager is required');
          }
          const query = async (sql: string, params?: any[]) => {
            return await manager.query(sql, params);
          };
          // Check if security already exists
          const existing = await query(
            'SELECT * FROM user_security WHERE "userId" = $1',
            [dto.user.id],
          );
          if (existing.length > 0) {
            return;
          }
          // Insert user_security
          await query(
            'INSERT INTO user_security ("userId", "twoFactorData", "twoFactorType", "twoFactorEnabled", "failed_2fa_attempts", "lockedUntil", "lastChangedAt") VALUES ($1, $2, $3, $4, 0, NULL, NOW())',
            [
              dto.user.id,
              JSON.stringify({ secret: 'mock-secret', enabled: false }),
              'totp',
              false,
            ],
          );
        }),
      findOneByUser: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue({}),
    })),
  };
});

// Desactivar throttling en tests
ThrottlerGuard.prototype.canActivate = async () => true;

// Increase timeout for all tests in this file
jest.setTimeout(120000);

describe('OAuth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testDbName: string;

  beforeAll(async () => {
    // Create a unique database for this test file to avoid concurrency issues
    testDbName = `auth_db_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    process.env.DB_DATABASE = testDbName;
    process.env.DB_SYNCHRONIZE = 'true'; // Enable schema sync

    // Create the test database using a maintenance connection
    const maintenanceDs = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres',
      entities: [],
      synchronize: false,
      logging: false,
    });
    await maintenanceDs.initialize();
    try {
      await maintenanceDs.query(`CREATE DATABASE "${testDbName}"`);
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
    await maintenanceDs.destroy();

    // Load AppModule dynamically after setting env vars to ensure it uses the test database
    AppModule = (await import('../../../src/app.module')).AppModule;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendMail: jest.fn().mockResolvedValue({}),
        sendVerificationEmail: jest.fn().mockResolvedValue({}),
        sendPasswordResetEmail: jest.fn().mockResolvedValue({}),
        sendTwoFactorEmail: jest.fn().mockResolvedValue({}),
        sendEmailChangeOtp: jest.fn().mockResolvedValue({}),
        sendAccountDeactivationEmail: jest.fn().mockResolvedValue({}),
        sendAccountBlockedEmail: jest.fn().mockResolvedValue({}),
        sendLoginAlertEmail: jest.fn().mockResolvedValue({}),
        sendEmailUpdateNotification: jest.fn().mockResolvedValue({}),
      })
      .overrideProvider(UsersService)
      .useFactory({
        factory: (dataSource: DataSource) => {
          return {
            async findOneByEmail(email: string, _i18n?: any, _manager?: any) {
              console.error('[MOCK] findOneByEmail called with:', email);
              console.error(
                '[MOCK] findOneByEmail _manager provided:',
                !!_manager,
              );
              try {
                const query = async (sql: string, params?: any[]) => {
                  if (_manager && typeof _manager.query === 'function') {
                    console.error('[MOCK] findOneByEmail using _manager.query');
                    return await _manager.query(sql, params);
                  }
                  console.error('[MOCK] findOneByEmail using dataSource.query');
                  return await dataSource.query(sql, params);
                };
                const users = await query(
                  'SELECT * FROM users WHERE email = $1',
                  [email],
                );
                console.error('[MOCK] query users result count:', users.length);
                if (users.length === 0) {
                  throw new HttpException('Invalid credentials', 401);
                }
                const user = users[0];
                console.error(
                  '[MOCK] findOneByEmail email:',
                  email,
                  'status:',
                  user.status,
                );
                console.error(
                  '[MOCK] user.id:',
                  user.id,
                  'user.roleId:',
                  user.roleId,
                );
                // Obtener el rol del usuario
                const roleResult = await query(
                  'SELECT * FROM roles WHERE id = $1',
                  [user.roleId],
                );
                console.error('[MOCK] roleResult:', roleResult);
                if (roleResult.length > 0) {
                  // Asignar el rol con name y permissions (asumiendo que permissions es un array o JSON)
                  user.role = {
                    name: roleResult[0].name,
                    permissions: roleResult[0].permissions || [],
                  };
                } else {
                  // Fallback si no encuentra rol
                  user.role = { name: 'user', permissions: [] };
                }
                console.error('[MOCK] user.role assigned:', user.role);
                const creds = await query(
                  'SELECT * FROM user_account_credentials WHERE "userId" = $1',
                  [user.id],
                );
                console.error('[MOCK] query creds result count:', creds.length);
                if (creds.length === 0) {
                  throw new HttpException('Invalid credentials', 401);
                }
                const result = { ...user, password: creds[0].password };
                console.error(
                  '[MOCK] findOneByEmail result has role:',
                  !!result.role,
                );
                return result;
              } catch (error) {
                console.error('[MOCK] findOneByEmail error:', error);
                throw error;
              }
            },
            async findOne(
              id: number,
              relationsOrI18n?: any,
              _i18n?: any,
              _manager?: any,
            ) {
              // Normalizar relations: si el segundo arg es array, usarlo; si no, relations vacío
              const relations = Array.isArray(relationsOrI18n)
                ? relationsOrI18n
                : [];
              console.error(
                '[MOCK] findOne called with id:',
                id,
                'relations:',
                relations,
              );
              try {
                const query = async (sql: string, params?: any[]) => {
                  if (_manager && typeof _manager.query === 'function') {
                    return await _manager.query(sql, params);
                  }
                  const result = await dataSource.query(sql, params);
                  // Automatically create twoFactorData for user_security inserts
                  if (sql.startsWith('INSERT INTO user_security')) {
                    const userId = params.find(
                      (p) => typeof p === 'number' && p > 0,
                    ) as number;
                    if (userId) {
                      await dataSource.query(
                        'INSERT INTO user_security ("userId", "twoFactorData") VALUES ($1, $2)',
                        [
                          userId,
                          JSON.stringify({
                            secret: 'mock-secret',
                            enabled: true,
                          }),
                        ],
                      );
                    }
                  }
                  return result;
                };

                const users = await query('SELECT * FROM users WHERE id = $1', [
                  id,
                ]);
                console.error(
                  '[MOCK] findOne query result count:',
                  users.length,
                );
                if (users.length === 0) {
                  console.error('[MOCK] findOne: user not found for id:', id);
                  return { data: null };
                }
                const user = users[0];
                console.error(
                  '[MOCK] findOne returning user with id:',
                  user.id,
                );
                // Cargar rol siempre (necesario para refresh token y otros)
                const roleResult = await query(
                  'SELECT * FROM roles WHERE id = $1',
                  [user.roleId],
                );
                if (roleResult.length > 0) {
                  user.role = {
                    name: roleResult[0].name,
                    permissions: roleResult[0].permissions || [],
                  };
                } else {
                  user.role = { name: 'user', permissions: [] };
                }
                // Cargar relaciones siempre (para tests)
                // security
                const security = await query(
                  'SELECT * FROM user_security WHERE "userId" = $1',
                  [id],
                );
                user.security = security.length > 0 ? security[0] : null;
                console.error(
                  '[MOCK] findOne assigned user.security:',
                  user.security,
                );
                // userAccountCredentials
                const creds = await query(
                  'SELECT * FROM user_account_credentials WHERE "userId" = $1',
                  [id],
                );
                user.userAccountCredentials =
                  creds.length > 0 ? creds[0] : null;
                // userTokens solo si se solicitan explícitamente
                if (relations.includes('userTokens')) {
                  const tokens = await query(
                    'SELECT * FROM user_tokens WHERE "userId" = $1',
                    [id],
                  );
                  user.userTokens = tokens;
                }
                return { data: user };
              } catch (error) {
                console.error('[MOCK] findOne error:', error);
                throw error;
              }
            },
            async findById(id: number, _i18n?: any, _manager?: any) {
              const result = await this.findOne(id, _i18n, _manager);
              return result?.data || null;
            },
            async create(createUserDto: any, _i18n: any, _manager: any) {
              console.error('[MOCK] create called with:', createUserDto);
              console.error('[MOCK] create _manager provided:', !!_manager);
              try {
                const query = async (sql: string, params?: any[]) => {
                  if (_manager && typeof _manager.query === 'function') {
                    console.error('[MOCK] create using _manager.query');
                    return await _manager.query(sql, params);
                  }
                  console.error('[MOCK] create using dataSource.query');
                  return await dataSource.query(sql, params);
                };
                // Verificar duplicados usando query directa
                const existing = await query(
                  'SELECT * FROM users WHERE email = $1',
                  [createUserDto.email],
                );
                if (existing.length > 0) {
                  console.error(
                    '[MOCK] create: user exists by email:',
                    existing[0].id,
                  );
                  throw new HttpException('User already exists', 409);
                }
                if (createUserDto.document) {
                  const existingDoc = await query(
                    'SELECT * FROM users WHERE document = $1',
                    [createUserDto.document],
                  );
                  if (existingDoc.length > 0) {
                    console.error(
                      '[MOCK] create: user exists by document:',
                      existingDoc[0].id,
                    );
                    throw new HttpException('User already exists', 409);
                  }
                }

                // Asegurar que exista un rol válido
                let roleId = createUserDto.roleId || 2;
                const roleCheck = await query(
                  'SELECT id FROM roles WHERE id = $1',
                  [roleId],
                );
                if (roleCheck.length === 0) {
                  const anyRole = await query('SELECT id FROM roles LIMIT 1');
                  if (anyRole.length > 0) {
                    roleId = anyRole[0].id;
                  } else {
                    const insertRole = await query(
                      'INSERT INTO roles (name, permissions, "createdAt") VALUES ($1, $2, NOW()) RETURNING id',
                      ['user', '[]'],
                    );
                    roleId = insertRole[0].id;
                  }
                }

                // Asegurar identityTypeId válido o null
                let identityTypeId = createUserDto.documentTypeId;
                if (identityTypeId) {
                  const itCheck = await query(
                    'SELECT id FROM identity_types WHERE id = $1',
                    [identityTypeId],
                  );
                  if (itCheck.length === 0) {
                    identityTypeId = null;
                  }
                }

                // Generar user_secret
                const user_secret =
                  Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);

                // Insertar usuario con manejo de unique Violation
                const insertUserQuery = `
                  INSERT INTO users (name, lastname, document, email, status, "user_secret", "identityTypeId", "roleId", "createdAt", "updatedAt")
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                  RETURNING *
                `;
                let user;
                try {
                  const userResult = await query(insertUserQuery, [
                    createUserDto.name,
                    createUserDto.lastname || null,
                    createUserDto.document || null,
                    createUserDto.email,
                    'pending',
                    user_secret,
                    identityTypeId,
                    roleId,
                  ]);
                  user = userResult[0];
                } catch (error) {
                  if ((error as any).code === '23505') {
                    throw new HttpException('User already exists', 409);
                  }
                  throw error;
                }
                console.error('[MOCK] inserted user:', user);

                // Also create credentials for the user (mimicking backend flow)
                const password_hash = await bcrypt.hash(
                  createUserDto.password,
                  10,
                );
                await query(
                  'INSERT INTO user_account_credentials ("userId", password, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())',
                  [user.id, password_hash, true],
                );

                return user;
              } catch (error) {
                console.error('[MOCK] create error:', error);
                throw error;
              }
            },
            async updatePassword(userId: number, _i18n?: any, _manager?: any) {
              // Mock simple: no hace nada, solo retorna true
              return true;
            },
            async verifyEmail(token: string, _i18n?: any, _manager?: any) {
              console.error('[MOCK] verifyEmail called with token:', token);
              try {
                const query = async (sql: string, params?: any[]) => {
                  if (_manager && typeof _manager.query === 'function') {
                    return await _manager.query(sql, params);
                  }
                  return await dataSource.query(sql, params);
                };
                const tokenRow = await query(
                  'SELECT * FROM user_tokens WHERE token = $1 AND "isUsed" = false',
                  [token],
                );
                console.error('[MOCK] tokenRow:', tokenRow);
                if (tokenRow.length === 0) {
                  throw new HttpException('Invalid or used token', 400);
                }
                const userToken = tokenRow[0];
                console.error('[MOCK] userToken:', userToken);
                const userId = userToken.userId || userToken.user_id;
                console.error('[MOCK] userId to update:', userId);
                await query(
                  'UPDATE user_tokens SET "isUsed" = true WHERE id = $1',
                  [userToken.id],
                );
                await query(
                  'UPDATE users SET status = $1, "updatedAt" = NOW() WHERE id = $2',
                  ['active', userId],
                );
                const user = await query('SELECT * FROM users WHERE id = $1', [
                  userId,
                ]);
                console.error('[MOCK] user after update:', user[0]);
                return user[0];
              } catch (error) {
                console.error('[MOCK] verifyEmail error:', error);
                throw error;
              }
            },
            async isValidPassword(
              user: any,
              password: string,
              _i18n?: any,
              _manager?: any,
            ): Promise<boolean> {
              // Si user es null o undefined, retornar false
              if (!user) {
                return false;
              }
              console.error(
                '[MOCK] isValidPassword called for user:',
                user.email,
                'status:',
                user.status,
              );
              let hash: string;
              if (user.password) {
                hash = user.password;
              } else {
                const query = async (sql: string, params?: any[]) => {
                  if (_manager && typeof _manager.query === 'function') {
                    return await _manager.query(sql, params);
                  }
                  return await dataSource.query(sql, params);
                };
                const creds = await query(
                  'SELECT password FROM user_account_credentials WHERE "userId" = $1',
                  [user.id],
                );
                if (creds.length === 0) return false;
                hash = creds[0].password;
              }
              return await bcrypt.compare(password, hash);
            },
            async getUserSecret(userId: number, _i18n?: any, _manager?: any) {
              console.error(
                '[MOCK] UsersService.getUserSecret called with userId:',
                userId,
              );
              const query = async (sql: string, params?: any[]) => {
                if (_manager && typeof _manager.query === 'function') {
                  return await _manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              const users = await query(
                'SELECT user_secret FROM users WHERE id = $1',
                [userId],
              );
              console.error(
                '[MOCK] getUserSecret users result count:',
                users.length,
              );
              if (users.length === 0) return null;
              const secret = users[0].user_secret;
              console.error('[MOCK] getUserSecret returning secret:', secret);
              return secret;
            },
            async me(req: any, _i18n?: any) {
              try {
                console.error('[MOCK] me called');
                const userId = req.user['sub'];
                console.error('[MOCK] me userId:', userId);
                const result = await this.findOne(userId, _i18n);
                console.error('[MOCK] me findOne result:', result);
                const user = result.data;
                if (!user) throw new HttpException('User not found', 404);
                delete user.user_secret;
                // Obtener cuentas OAuth
                const oauthAccounts = await dataSource.query(
                  'SELECT * FROM user_account_oauth WHERE "userId" = $1',
                  [userId],
                );
                console.error(
                  '[MOCK] me oauthAccounts count:',
                  oauthAccounts.length,
                );
                // Security: user.security viene de findOne y es un objeto plano con snake_case
                const security = user.security || {};
                const twoFactorEnabled = security.two_factor_enabled;
                const twoFactorType = security.two_factor_type;
                console.error('[MOCK] me security:', {
                  twoFactorEnabled,
                  twoFactorType,
                });
                const response = {
                  success: true,
                  data: {
                    ...user,
                    oauth: oauthAccounts,
                    security: { twoFactorEnabled, twoFactorType },
                  },
                  meta: { total: 1 },
                  error: null,
                };
                console.error('[MOCK] me response:', response);
                return response;
              } catch (error) {
                console.error('[MOCK] me error:', error);
                throw error;
              }
            },
          };
        },
        inject: [DataSource],
      })
      .overrideProvider(CredentialsService)
      .useValue({
        create: jest.fn().mockResolvedValue({}),
        findCredentialsOfUser: jest
          .fn()
          .mockResolvedValue({ provider: 'credentials' }),
      })
      .overrideProvider(TokensService)
      .useFactory({
        factory: (dataSource: DataSource) => {
          return {
            async createTokenEmailVerification(
              user: any,
              i18n?: any,
              _manager?: any,
            ) {
              const userId = user.user?.id || user.id;
              const token =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
              const query = async (sql: string, params?: any[]) => {
                if (_manager && typeof _manager.query === 'function') {
                  return await _manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              await query(
                'INSERT INTO user_tokens (token, type, "expiresAt", "isUsed", "userId", "createdAt") VALUES ($1, $2, NOW() + INTERVAL \'24 hours\', false, $3, NOW())',
                [token, 'emailVerification', userId],
              );
              return { token };
            },
            async createTokenPasswordReset(email: string, i18n?: any) {
              const users = await dataSource.query(
                'SELECT id FROM users WHERE email = $1',
                [email],
              );
              if (users.length === 0) {
                throw new HttpException('User not found', 404);
              }
              const userId = users[0].id;
              const token =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
              await dataSource.query(
                'INSERT INTO user_tokens (token, type, "expiresAt", "isUsed", "userId", "createdAt") VALUES ($1, $2, NOW() + INTERVAL \'1 hour\', false, $3, NOW())',
                [token, 'passwordReset', userId],
              );
              return { token };
            },
            async createTokenAccess(payload: any) {
              return `mock-access-token-${payload.sub}`;
            },
            async createTokenRefresh(payload: any) {
              return `mock-refresh-token-${payload.sub}`;
            },
            async findTokenByUserId(
              userId: number,
              type: UserTokenEnum,
              _manager?: any,
            ) {
              const query = async (sql: string, params?: any[]) => {
                if (_manager && typeof _manager.query === 'function') {
                  return await _manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              const result = await query(
                'SELECT * FROM user_tokens WHERE "userId" = $1 AND type = $2 AND "isUsed" = false',
                [userId, type],
              );
              return result.length > 0 ? result[0] : null;
            },
            async findTokenByToken(token: string, i18n?: any) {
              const result = await dataSource.query(
                'SELECT * FROM user_tokens WHERE token = $1 AND "isUsed" = false',
                [token],
              );
              return result.length > 0 ? result[0] : null;
            },
            async revokeRefreshToken(token: string) {
              await dataSource.query(
                'UPDATE user_tokens SET "isUsed" = true WHERE token = $1',
                [token],
              );
              return {};
            },
            async updateTokenIsUsed(token: string, i18n?: any, _manager?: any) {
              const query = async (sql: string, params?: any[]) => {
                if (_manager && typeof _manager.query === 'function') {
                  return await _manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              await query(
                'UPDATE user_tokens SET "isUsed" = true WHERE token = $1',
                [token],
              );
              return {};
            },
          };
        },
        inject: [DataSource],
      })
      .overrideProvider(JwtService)
      .useValue({
        sign: jest.fn().mockImplementation((payload: any, _options?: any) => {
          const userId = payload?.sub || payload?.userId || 1;
          const sessionId = payload?.sessionId || 0;
          const timestamp = Date.now();
          return `mock-jwt-token-${userId}-${sessionId}-${timestamp}`;
        }),
        verify: jest.fn().mockImplementation(function (token: string) {
          if (token === 'invalid-refresh-token') {
            throw new Error('invalid token');
          }
          // Tokens de acceso: mock-access-token-<userId>
          const accessMatch = token.match(/^mock-access-token-(\d+)/);
          if (accessMatch) {
            const userId = parseInt(accessMatch[1], 10);
            return { sub: userId, sessionId: 0 };
          }
          // Tokens JWT: mock-jwt-token-<userId>-<sessionId>-<timestamp>
          const jwtMatch = token.match(/^mock-jwt-token-(\d+)-(\d+)-(\d+)$/);
          if (jwtMatch) {
            const [, userId, sessionId] = jwtMatch;
            return { sub: Number(userId), sessionId: Number(sessionId) };
          }
          return { sub: 1, sessionId: 0 };
        }),
        decode: jest.fn().mockImplementation((token: string) => {
          const accessMatch = token.match(/^mock-access-token-(\d+)/);
          if (accessMatch) {
            const userId = parseInt(accessMatch[1], 10);
            return { sub: userId, sessionId: 0 };
          }
          const jwtMatch = token.match(/^mock-jwt-token-(\d+)-(\d+)-(\d+)$/);
          if (jwtMatch) {
            const [, userId, sessionId] = jwtMatch;
            return { sub: Number(userId), sessionId: Number(sessionId) };
          }
          return null;
        }),
        verifyAsync: jest.fn().mockImplementation(async function (
          token: string,
          options?: any,
        ) {
          // Use function expression to have `this` bound to the mock
          // @ts-ignore
          return this.verify(token, options);
        }),
      })
      .overrideProvider(SessionService)
      .useValue({
        create: jest.fn().mockResolvedValue({}),
      })
      .overrideProvider(AuthSessionsService)
      .useValue({
        createAuthSession: jest.fn().mockResolvedValue({ id: 1 }),
        updateActive: jest.fn().mockResolvedValue({}),
        findBySessionId: jest.fn().mockResolvedValue(null),
        revokeTokenWithSessionId: jest.fn().mockResolvedValue({}),
        updateInactiveUserId: jest.fn().mockResolvedValue({}),
      })
      .overrideProvider(AuthRefreshTokensService)
      .useValue({
        createRefreshToken: jest
          .fn()
          .mockImplementation(async (payload: any) => {
            console.error(
              '[MOCK] AuthRefreshTokensService.createRefreshToken called with payload:',
              payload,
            );
            const userId = payload?.userId || payload?.user?.id || 1;
            const sessionId = payload?.sessionId || 1;
            const timestamp = Date.now();
            const token = `mock-jwt-token-${userId}-${sessionId}-${timestamp}`;
            console.error(
              '[MOCK] AuthRefreshTokensService.createRefreshToken returning token:',
              token,
            );
            return { token };
          }),
        findRefreshToken: jest
          .fn()
          .mockImplementation(async (token: string) => {
            const match = token.match(/^mock-jwt-token-(\d+)/);
            if (match) {
              const userId = parseInt(match[1], 10);
              return {
                token,
                userId,
                revoked: false,
                expiresAt: new Date(Date.now() + 1000000),
              };
            }
            return null;
          }),
        validateRefreshToken: jest
          .fn()
          .mockImplementation(async (token: string) => {
            console.error(
              '[MOCK] validateRefreshToken called with token:',
              token,
            );
            const match = token.match(/^mock-jwt-token-(\d+)/);
            if (!match) {
              console.error(
                '[MOCK] validateRefreshToken: token does not match pattern',
              );
              throw new Error('Invalid refresh token');
            }
            const userId = parseInt(match[1], 10);
            console.error(
              '[MOCK] validateRefreshToken extracted userId:',
              userId,
            );
            // Devolver authSession simulado
            const result = { authSession: { id: 1, userId } };
            console.error('[MOCK] validateRefreshToken returning:', result);
            return result;
          }),
        revokeRefreshToken: jest
          .fn()
          .mockImplementation(async (token: string) => {
            console.error(
              '[MOCK] revokeRefreshToken called with token:',
              token,
            );
            const match = token.match(/^mock-jwt-token-(\d+)/);
            if (!match) {
              console.error(
                '[MOCK] revokeRefreshToken: token does not match pattern',
              );
              throw new Error('Invalid refresh token');
            }
            const userId = parseInt(match[1], 10);
            console.error(
              '[MOCK] revokeRefreshToken extracted userId:',
              userId,
            );
            // Marcar token como revocado (en un mock no es necesario)
            const authSession = { id: 1, userId };
            console.error(
              '[MOCK] revokeRefreshToken returning authSession:',
              authSession,
            );
            return authSession;
          }),
        revokeTokenWithSessionId: jest.fn().mockResolvedValue({}),
        revokeTokenWithUserId: jest.fn().mockResolvedValue({}),
      })
      .overrideProvider(AttemptsService)
      .useValue({
        recordFailure: jest.fn().mockResolvedValue({}),
        reset: jest.fn().mockResolvedValue({}),
        findEmail: jest
          .fn()
          .mockResolvedValue({ failures: 0, lockedUntil: null }),
      })
      .overrideProvider(AuditLogService)
      .useValue({
        create: jest.fn().mockResolvedValue({}),
      })
      .overrideProvider(SecurityService)
      .useValue({
        create: jest.fn().mockResolvedValue({}),
        findOneByUser: jest.fn().mockResolvedValue({ twoFactorEnabled: false }),
      })
      .overrideProvider(TotpService)
      .useValue({
        enableTotp: jest.fn().mockResolvedValue({
          secret: 'mock-secret',
          qrCode: 'data:image/png;base64,',
        }),
        verifyToken: jest.fn().mockResolvedValue({ isValid: true }),
      })
      .overrideProvider(OtpsService)
      .useValue({
        createOtp: jest.fn().mockResolvedValue('123456'),
        enableOtps: jest.fn().mockResolvedValue({}),
        verifyOtps: jest.fn().mockResolvedValue({ isValid: true }),
      })
      .overrideProvider(OAuthService)
      .useValue({
        findAllOAuthWithUser: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({}),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(CustomValidationPipe);
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    dataSource = app.get(DataSource);
    await app.init();
    // Ensure schema is synchronized (create tables) in the test database
    await dataSource.synchronize();
  });

  afterEach(async () => {
    console.error('[MOCK] afterEach: cleaning database...');
    if (!dataSource) {
      if (app) {
        dataSource = app.get(DataSource);
      } else {
        console.error(
          '[MOCK] afterEach: app is not available, skipping cleanup',
        );
        return;
      }
    }
    // Eliminar datos en orden inverso de dependencias para evitar violaciones de FK
    const tables = [
      'user_tokens',
      'auth_refresh_tokens',
      'auth_sessions',
      'user_security_two_factor_otps',
      'user_security_recovery_codes',
      'user_security',
      'user_account_credentials',
      'user_account_oauth',
      'user_email_change_logs',
      'user_email_change_request',
      'user_sessions',
      'audit_logs',
      'auth_reauth_tokens',
      'users',
    ];
    for (const table of tables) {
      try {
        await dataSource.query(`DELETE FROM ${table}`);
      } catch (error) {
        console.error(`[MOCK] afterEach: error deleting from ${table}:`, error);
      }
    }
    // Verificar usuarios restantes
    try {
      const userCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM users',
      );
      console.error(
        '[MOCK] afterEach: remaining users count:',
        userCount[0].count,
      );
    } catch (e) {
      console.error('[MOCK] afterEach: error counting users:', e);
    }
    jest.clearAllMocks();
    console.error('[MOCK] afterEach: cleanup complete');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    // Drop the unique test database if it was created
    if (testDbName) {
      try {
        const maintenanceDs = new DataSource({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: 'postgres',
          entities: [],
          synchronize: false,
          logging: false,
        });
        await maintenanceDs.initialize();
        await maintenanceDs.query(`DROP DATABASE IF EXISTS "${testDbName}"`);
        await maintenanceDs.destroy();
      } catch (error) {
        console.error('Failed to drop test database:', error);
      }
    }
  });

  // Limpiar datos de usuario antes de cada test para evitar conflictos
  beforeEach(async () => {
    // Eliminar en orden inverso de dependencias
    await dataSource
      .getRepository(AuthReAuthToken)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserToken)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(AuthRefreshTokens)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(AuthSessions)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserSecurityTwoFactorOtps)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserSecurity)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserSession)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserAccountOAuth)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserAccountCredentials)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserEmailChangeLog)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserEmailChangeRequest)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(User)
      .createQueryBuilder()
      .delete()
      .execute();
  });

  describe('GET /auth/google', () => {
    it('should redirect to Google OAuth authorization URL', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google')
        .expect(302);

      expect(response.headers.location).toBeDefined();
      expect(response.headers.location).toContain('accounts.google.com');
      expect(response.headers.location).toContain('oauth2/v2/auth');
    });
  });

  describe('GET /auth/facebook', () => {
    it('should redirect to Facebook OAuth authorization URL', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/facebook')
        .expect(302);

      expect(response.headers.location).toBeDefined();
      expect(response.headers.location).toContain('facebook.com');
      expect(response.headers.location).toContain('dialog/oauth');
    });
  });

  describe('GET /auth/github', () => {
    it('should redirect to GitHub OAuth authorization URL', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/github')
        .expect(302);

      expect(response.headers.location).toBeDefined();
      expect(response.headers.location).toContain('github.com');
      expect(response.headers.location).toContain('login/oauth/authorize');
    });
  });

  describe('GET /auth/google/callback', () => {
    it('should handle OAuth callback with invalid state', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google/callback')
        .query({
          code: 'test-oauth-code',
          state: 'invalid-state',
        })
        .expect(500);

      // Just check that we get an error response (status 500)
      expect(response.status).toBe(500);
    });
  });

  describe('GET /auth/facebook/callback', () => {
    it('should handle Facebook OAuth callback with invalid state', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/facebook/callback')
        .query({
          code: 'test-oauth-code',
          state: 'invalid-state',
        })
        .expect(500);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /auth/github/callback', () => {
    it('should handle GitHub OAuth callback with invalid state', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/github/callback')
        .query({
          code: 'test-oauth-code',
          state: 'test-state',
        })
        .expect(500);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /auth/unlink/:provider', () => {
    let authToken: string;

    const setupUser = async (email: string) => {
      // Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test',
          lastname: 'User',
          documentTypeId: 1,
          document: '1234567890',
          email: email,
          password: 'Password123!',
        })
        .expect(201);

      // Get user from DB
      const userResult = await dataSource.query(
        'SELECT * FROM users WHERE email = $1',
        [email],
      );
      if (userResult.length === 0) {
        throw new Error('User not found after registration');
      }
      const user = userResult[0];

      // Activate user directly
      await dataSource.query('UPDATE users SET status = $1 WHERE id = $2', [
        'active',
        user.id,
      ]);

      // Delete any existing emailVerification tokens for this user
      await dataSource.query(
        'DELETE FROM user_tokens WHERE "userId" = $1 AND type = $2',
        [user.id, 'emailVerification'],
      );

      // Insert a new manual verification token
      const token = `verification-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await dataSource.query(
        'INSERT INTO user_tokens (token, type, "expiresAt", "isUsed", "userId", "createdAt") VALUES ($1, $2, NOW() + INTERVAL \'24 hours\', false, $3, NOW())',
        [token, 'emailVerification', user.id],
      );

      // Verify email via endpoint
      await request(app.getHttpServer())
        .post(`/auth/verify-email/${token}`)
        .expect(201);

      // Wait a bit to avoid throttling (1 second)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Login
      const loginData = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: email,
          password: 'Password123!',
        })
        .expect(201);

      // Exchange refresh token for access token
      const refreshResponse = await request(app.getHttpServer())
        .post(`/auth/refresh-token/${loginData.body.data.refreshToken}`)
        .send({})
        .expect(201);

      authToken = refreshResponse.body.data.access_token;
    };

    it('should unlink OAuth provider from user account', async () => {
      const userEmail = `test-unlink-${Date.now()}@example.com`;
      await setupUser(userEmail);

      const response = await request(app.getHttpServer())
        .post('/auth/unlink/google')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
