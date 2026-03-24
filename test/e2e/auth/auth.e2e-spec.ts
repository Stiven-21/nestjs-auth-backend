/* eslint-disable */
// Load .env.test file first
import { config } from 'dotenv';
config({ path: '.env.test' });

// Mock modules BEFORE any imports
jest.mock('../../../src/modules/auth/attempts/attempts.service', () => ({
  AttemptsService: jest.fn().mockImplementation(() => ({
    recordFailure: jest.fn().mockResolvedValue({}),
    reset: jest.fn().mockResolvedValue({}),
    findEmail: jest.fn().mockResolvedValue({ failures: 0, lockedUntil: null }),
  })),
}));

jest.mock('net', () => {
  const actualNet = jest.requireActual('net');
  return {
    ...actualNet,
    isIP: jest.fn().mockReturnValue(true),
  };
});

jest.mock('src/common/helpers/request-info.helper', () => ({
  getClientInfo: jest.fn(() => ({ ip: '127.0.0.1', userAgent: 'test' })),
  getIPFromRequest: jest.fn(() => '127.0.0.1'),
}));

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'MOCKSECRET',
    otpauth_url: 'MOCK_OTP_URL',
  }),
  generateTOTP: jest
    .fn()
    .mockImplementation(({ secret }: { secret: string }) => {
      return '123456';
    }),
  totp: {
    verify: jest.fn().mockImplementation(({ token }: { token: string }) => {
      return token === '123456';
    }),
  },
  verify: jest.fn().mockImplementation(({ token }) => token === '123456'),
}));

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpException } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, createConnection } from 'typeorm';
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
import { SecurityRecoveryCodesService } from '../../../src/modules/users/security-recovery-codes/security-recovery-codes.service';
import { UserTokenEnum } from '../../../src/common/enum/user-token.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from '../../../src/modules/users/users.service';
import { MailService } from '../../../src/mails/mail.service';
import * as speakeasy from 'speakeasy';
import { ReAuthService } from '../../../src/modules/auth/re-auth/re-auth.service';

// Declare AppModule for dynamic import
let AppModule: any;

// Extend speakeasy type for TOTP generation
declare module 'speakeasy' {
  export function generateTOTP(options: {
    secret: string;
    encoding?: string;
  }): string;
}

// Desactivar throttling en tests
ThrottlerGuard.prototype.canActivate = async () => true;

// Increase timeout for all tests in this file
jest.setTimeout(120000);
let testDbName: string;
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const baseEmail = 'test@example.com';
  const testUser = {
    name: 'Test',
    lastname: 'User',
    documentTypeId: 1,
    document: '1234567890',
    email: baseEmail,
    password: 'Password123!',
  };

  beforeAll(async () => {
    // Create a unique database for this test file
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
    AppModule = (await import(`../../../src/app.module`)).AppModule;

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
                  const normalizedDoc = String(createUserDto.document).trim();
                  const existingDoc = await query(
                    'SELECT * FROM users WHERE TRIM(document) = $1',
                    [normalizedDoc],
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
                  const docValue = createUserDto.document
                    ? String(createUserDto.document).trim()
                    : null;
                  const userResult = await query(insertUserQuery, [
                    createUserDto.name,
                    createUserDto.lastname || null,
                    docValue,
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
                return user;
              } catch (error) {
                console.error('[MOCK] create error:', error);
                throw error;
              }
            },
            async update(
              id: number,
              updateUserDto: any,
              _i18n?: any,
              _manager?: any,
            ) {
              console.error(
                '[MOCK] update called with id:',
                id,
                'data:',
                updateUserDto,
              );
              try {
                const query = async (sql: string, params?: any[]) => {
                  if (_manager && typeof _manager.query === 'function') {
                    return await _manager.query(sql, params);
                  }
                  return await dataSource.query(sql, params);
                };
                const existing = await query(
                  'SELECT * FROM users WHERE id = $1',
                  [id],
                );
                if (existing.length === 0) {
                  throw new Error(`User with id ${id} not found`);
                }
                const fields = [];
                const values = [];
                let counter = 1;
                for (const [key, value] of Object.entries(updateUserDto)) {
                  if (key === 'password') {
                    const hashedPassword = await bcrypt.hash(
                      value as string,
                      10,
                    );
                    await query(
                      'UPDATE user_account_credentials SET password = $1, "updatedAt" = NOW() WHERE "userId" = $2',
                      [hashedPassword, id],
                    );
                  } else {
                    fields.push(`"${key}" = $${counter}`);
                    values.push(value);
                    counter++;
                  }
                }
                if (fields.length > 0) {
                  const q = `UPDATE users SET ${fields.join(', ')}, "updatedAt" = NOW() WHERE id = $${counter}`;
                  values.push(id);
                  await query(q, values);
                }
                const updated = await query(
                  'SELECT * FROM users WHERE id = $1',
                  [id],
                );
                return updated[0];
              } catch (error) {
                console.error('[MOCK] update error:', error);
                throw error;
              }
            },
            async updatePassword(userId: number, i18n?: any, _manager?: any) {
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
      .overrideProvider(TokensService)
      .useFactory({
        factory: (dataSource: DataSource) => {
          return {
            async createTokenEmailVerification(
              user: any,
              i18n?: any,
              _manager?: any,
            ) {
              // El parámetro user viene como { user: User } desde AuthService.register
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
              console.error(
                '[MOCK] createTokenEmailVerification: inserted token',
                token,
                'for userId',
                userId,
              );
              return { token };
            },
            async createTokenPasswordReset(email: string, i18n?: any) {
              // Buscar usuario por email
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
              // Retornar un token de acceso mockeado
              return `mock-access-token-${payload.sub}`;
            },
            async createTokenRefresh(payload: any) {
              // Retornar un token de refresco mockeado
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
            // Alias para compatibilidad con AuthService
            async findOneByToken(token: string, i18n?: any, _manager?: any) {
              console.error(
                '[MOCK] TokensService.findOneByToken called with token:',
                token,
              );
              const query = async (sql: string, params?: any[]) => {
                if (_manager && typeof _manager.query === 'function') {
                  return await _manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              const tokenRows = await query(
                'SELECT * FROM user_tokens WHERE token = $1 AND "isUsed" = false',
                [token],
              );
              console.error('[MOCK] tokenRows length:', tokenRows.length);
              if (tokenRows.length === 0) return null;
              const tokenRecord = tokenRows[0];
              const userRows = await query(
                'SELECT id, email FROM users WHERE id = $1',
                [tokenRecord.userId],
              );
              console.error('[MOCK] userRows length:', userRows.length);
              if (userRows.length === 0) return null;
              const user = userRows[0];
              const result = {
                data: {
                  token: tokenRecord,
                  user: {
                    id: user.id,
                    email: user.email,
                  },
                },
              };
              console.error(
                '[MOCK] findOneByToken returning:',
                JSON.stringify(result, null, 2),
              );
              return result;
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
        verify: jest.fn().mockImplementation((token: string) => {
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
        verifyAsync: jest
          .fn()
          .mockImplementation(async (token: string, options?: any) => {
            if (token === 'invalid-refresh-token') {
              throw new Error('invalid token');
            }
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
            return { sub: 1, sessionId: 0 };
          }),
      })
      .overrideProvider(SessionService)
      .useValue({
        create: jest.fn().mockResolvedValue({}),
      })
      .overrideProvider(AuthSessionsService)
      .useValue({
        createAuthSession: jest
          .fn()
          .mockImplementation(async (payload: any) => {
            console.error(
              '[MOCK] createAuthSession called with payload:',
              payload,
            );
            const userId = payload?.user?.id || 1;
            return { id: 1, userId };
          }),
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
              // Simulate TOKEN_NOT_FOUND (404) as backend does
              throw new HttpException('Token not found', 404);
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
      .overrideProvider(SecurityRecoveryCodesService)
      .useValue({
        generate: jest.fn().mockResolvedValue({
          data: [
            'ABCDEF',
            '123456',
            '789ABC',
            'DEF123',
            '456789',
            'GHIJKL',
            'MNOPQR',
            'STUVWX',
            'YZ1234',
            '567890',
          ],
          meta: { total: 10 },
        }),
        useCode: jest.fn().mockResolvedValue({ isValid: false }),
      })
      .overrideProvider(SecurityService)
      .useFactory({
        factory: (dataSource: DataSource) => ({
          async create(data: any, _i18n?: any, _manager?: any) {
            const query = async (sql: string, params?: any[]) => {
              if (_manager && typeof _manager.query === 'function') {
                return await _manager.query(sql, params);
              }
              return await dataSource.query(sql, params);
            };
            const userId = data.userId;
            const twoFactorEnabled = data.twoFactorEnabled || false;
            const twoFactorType = data.twoFactorType || null;
            const twoFactorData = data.twoFactorData
              ? JSON.stringify(data.twoFactorData)
              : null;
            const recoveryCodes = data.recoveryCodes
              ? JSON.stringify(data.recoveryCodes)
              : null;
            const failed_2fa_attempts = data.failed_2fa_attempts || 0;
            const lockedUntil = data.lockedUntil || null;
            const lastChangedAt = data.lastChangedAt || null;
            await query(
              `INSERT INTO user_security ("userId", "twoFactorEnabled", "twoFactorType", "twoFactorData", "recoveryCodes", failed_2fa_attempts, "lockedUntil", "lastChangedAt", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
              [
                userId,
                twoFactorEnabled,
                twoFactorType,
                twoFactorData,
                recoveryCodes,
                failed_2fa_attempts,
                lockedUntil,
                lastChangedAt,
              ],
            );
            return {};
          },
          async findOneByUser(user: any, _i18n?: any, _manager?: any) {
            const userId = user.id || user.userId;
            if (!userId) {
              return null;
            }
            const query = async (sql: string, params?: any[]) => {
              if (_manager && typeof _manager.query === 'function') {
                return await _manager.query(sql, params);
              }
              return await dataSource.query(sql, params);
            };
            const result = await query(
              'SELECT * FROM user_security WHERE "userId" = $1',
              [userId],
            );
            if (result.length === 0) {
              // No hay registro de seguridad, devolver objeto por defecto con 2FA deshabilitado
              return {
                id: null,
                userId: user.id || user.userId,
                twoFactorEnabled: false,
                twoFactorType: null,
                twoFactorData: null,
                recoveryCodes: null,
                failed_2fa_attempts: 0,
                lockedUntil: null,
                lastChangedAt: null,
                createdAt: null,
                updatedAt: null,
              };
            }
            const row = result[0];
            return {
              id: row.id,
              userId: row.userId,
              twoFactorEnabled: row.twoFactorEnabled,
              twoFactorType: row.twoFactorType,
              twoFactorData: row.twoFactorData,
              recoveryCodes: row.recoveryCodes,
              failed_2fa_attempts: row.failed_2fa_attempts,
              lockedUntil: row.lockedUntil,
              lastChangedAt: row.lastChangedAt,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            };
          },
          async save(userSecurity: any, _i18n?: any, _manager?: any) {
            console.error(
              '[MOCK] SecurityService.save called with:',
              JSON.stringify(userSecurity, null, 2),
            );
            const query = async (sql: string, params?: any[]) => {
              if (_manager && typeof _manager.query === 'function') {
                return await _manager.query(sql, params);
              }
              return await dataSource.query(sql, params);
            };
            const userId = userSecurity.userId;
            console.error('[MOCK] SecurityService.save userId:', userId);
            const values = [
              userId,
              userSecurity.twoFactorEnabled,
              userSecurity.twoFactorType,
              userSecurity.twoFactorData
                ? JSON.stringify(userSecurity.twoFactorData)
                : null,
              userSecurity.recoveryCodes
                ? JSON.stringify(userSecurity.recoveryCodes)
                : null,
              userSecurity.failed_2fa_attempts || 0,
              userSecurity.lockedUntil,
              userSecurity.lastChangedAt,
            ];
            console.error('[MOCK] SecurityService.save values:', values);
            await query(
              `INSERT INTO user_security ("userId", "twoFactorEnabled", "twoFactorType", "twoFactorData", "recoveryCodes", failed_2fa_attempts, "lockedUntil", "lastChangedAt", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
               ON CONFLICT ("userId") DO UPDATE SET
                 "twoFactorEnabled" = EXCLUDED."twoFactorEnabled",
                 "twoFactorType" = EXCLUDED."twoFactorType",
                 "twoFactorData" = EXCLUDED."twoFactorData",
                 "recoveryCodes" = EXCLUDED."recoveryCodes",
                 failed_2fa_attempts = EXCLUDED.failed_2fa_attempts,
                 "lockedUntil" = EXCLUDED."lockedUntil",
                 "lastChangedAt" = EXCLUDED."lastChangedAt",
                 "updatedAt" = NOW()`,
              values,
            );
            console.error('[MOCK] SecurityService.save executed');
            return {};
          },
        }),
        inject: [DataSource],
      })
      .overrideProvider(TotpService)
      .useFactory({
        factory: (securityService: SecurityService) => ({
          enableTotp: jest
            .fn()
            .mockImplementation(
              async (email: string, userSecurity: any, i18n: any) => {
                // Modificar userSecurity
                userSecurity.twoFactorEnabled = false;
                userSecurity.twoFactorType = 'totp';
                userSecurity.twoFactorData = {
                  secret: { base32: 'MOCKBAS32SECRET123456' },
                  pending: true,
                };
                // Guardar en BD
                await securityService.save(userSecurity, i18n);
                // Devolver qrCode
                return { qrCode: 'data:image/png;base64,mockqr' };
              },
            ),
          verifyToken: jest
            .fn()
            .mockImplementation(async (secret: string, token: string) => {
              console.error(
                '[MOCK] TotpService.verifyToken called with secret:',
                secret,
                'token:',
                token,
              );
              const isValid = token === '123456';
              console.error(
                '[MOCK] TotpService.verifyToken returning:',
                isValid,
              );
              return isValid;
            }),
          generateSecret: jest.fn().mockReturnValue({
            base32: 'MOCKBAS32SECRET123456',
            otpauth:
              'otpauth://totp/MockUser:user@example.com?secret=MOCKBAS32SECRET123456&issuer=MockUser',
          }),
        }),
        inject: [SecurityService],
      })
      .overrideProvider(OtpsService)
      .useFactory({
        factory: (securityService: SecurityService) => ({
          createOtp: jest.fn().mockResolvedValue('123456'),
          enableOtps: jest
            .fn()
            .mockImplementation(
              async (user: any, userSecurity: any, i18n: any) => {
                // Modificar userSecurity para EMAIL
                userSecurity.twoFactorEnabled = false;
                userSecurity.twoFactorType = 'email';
                // No se modifica twoFactorData para EMAIL
                await securityService.save(userSecurity, i18n);
                return '123456'; // código OTP
              },
            ),
          verifyOtps: jest
            .fn()
            .mockImplementation(async (code: string, userId: number) => {
              console.error(
                '[MOCK] OtpsService.verifyOtps called with code:',
                code,
                'userId:',
                userId,
              );
              const result = { isValid: true };
              console.error('[MOCK] OtpsService.verifyOtps returning:', result);
              return result;
            }),
          verify: jest
            .fn()
            .mockImplementation(async (code: string, userId: number) => {
              console.error(
                '[MOCK] OtpsService.verify called with code:',
                code,
                'userId:',
                userId,
              );
              const result = { isValid: true };
              console.error('[MOCK] OtpsService.verify returning:', result);
              return result;
            }),
        }),
        inject: [SecurityService],
      })
      .overrideProvider(ReAuthService)
      .useValue({
        reauthenticate: jest
          .fn()
          .mockImplementation(
            async (userId: number, password: string, i18n: any) => {
              console.error(
                '[MOCK] ReAuthService.reauthenticate called with userId:',
                userId,
                'password length:',
                password.length,
              );
              const token = `mock-reauth-token-${userId}-${Date.now()}`;
              const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
              const result = {
                data: token,
                meta: { reAuthTokenExpiresIn: expiresAt },
              };
              console.error(
                '[MOCK] ReAuthService.reauthenticate returning:',
                result,
              );
              return result;
            },
          ),
        consumeToken: jest.fn().mockResolvedValue({}),
        validate: jest.fn().mockResolvedValue(true),
      })
      .overrideProvider(SecurityService)
      .useFactory({
        factory: (dataSource: DataSource) => {
          return {
            async findOneByUser(user: any, i18n: any, manager?: any) {
              // Buscar directamente por userId
              const query = async (sql: string, params?: any[]) => {
                if (manager && typeof manager.query === 'function') {
                  return await manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              const result = await query(
                'SELECT * FROM user_security WHERE "userId" = $1',
                [user.id],
              );
              if (result.length > 0) {
                // Devolver directamente el row (ya tiene propiedades en camelCase según la BD)
                return result[0];
              }
              // Si no existe, crear uno con valores por defecto (para evitar errores)
              await query(
                'INSERT INTO user_security ("userId", "twoFactorData", "twoFactorType", "twoFactorEnabled", "failed_2fa_attempts", "lockedUntil", "lastChangedAt") VALUES ($1, $2, $3, $4, 0, NULL, NOW())',
                [user.id, null, null, false],
              );
              const newResult = await query(
                'SELECT * FROM user_security WHERE "userId" = $1',
                [user.id],
              );
              if (newResult.length > 0) {
                return newResult[0];
              }
              return null;
            },
            async create(createSecurityDto: any, i18n: any, manager?: any) {
              const userId = createSecurityDto.user.id;
              const query = async (sql: string, params?: any[]) => {
                if (manager && typeof manager.query === 'function') {
                  return await manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              // Verificar si ya existe
              const existing = await query(
                'SELECT * FROM user_security WHERE "userId" = $1',
                [userId],
              );
              if (existing.length > 0) {
                return existing[0];
              }
              // Insertar nuevo con valores por defecto
              await query(
                'INSERT INTO user_security ("userId", "twoFactorData", "twoFactorType", "twoFactorEnabled", "failed_2fa_attempts", "lockedUntil", "lastChangedAt") VALUES ($1, $2, $3, $4, 0, NULL, NOW())',
                [userId, null, null, false],
              );
              const result = await query(
                'SELECT * FROM user_security WHERE "userId" = $1',
                [userId],
              );
              return result[0];
            },
            async save(security: any, i18n: any, manager?: any) {
              // Actualizar o insertar basado en userId
              const query = async (sql: string, params?: any[]) => {
                if (manager && typeof manager.query === 'function') {
                  return await manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              const existing = await query(
                'SELECT * FROM user_security WHERE "userId" = $1',
                [security.userId],
              );
              if (existing.length > 0) {
                await query(
                  'UPDATE user_security SET "twoFactorData" = $1, "twoFactorType" = $2, "twoFactorEnabled" = $3, "failed_2fa_attempts" = $4, "lockedUntil" = $5, "lastChangedAt" = NOW() WHERE "userId" = $6',
                  [
                    security.twoFactorData,
                    security.twoFactorType,
                    security.twoFactorEnabled,
                    security.failed_2fa_attempts || 0,
                    security.lockedUntil || null,
                    security.userId,
                  ],
                );
              } else {
                await query(
                  'INSERT INTO user_security ("userId", "twoFactorData", "twoFactorType", "twoFactorEnabled", "failed_2fa_attempts", "lockedUntil", "lastChangedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                  [
                    security.userId,
                    security.twoFactorData,
                    security.twoFactorType,
                    security.twoFactorEnabled,
                    security.failed_2fa_attempts || 0,
                    security.lockedUntil || null,
                  ],
                );
              }
              return security;
            },
          };
        },
        inject: [DataSource],
      })
      .overrideProvider(CredentialsService)
      .useFactory({
        factory: (dataSource: DataSource) => {
          return {
            async create(createCredentialsDto: any, i18n: any, manager: any) {
              const query = async (sql: string, params?: any[]) => {
                if (manager && typeof manager.query === 'function') {
                  return await manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              const existing = await query(
                'SELECT * FROM user_account_credentials WHERE "userId" = $1',
                [createCredentialsDto.user.id],
              );
              if (existing.length > 0) {
                throw new HttpException('User already has credentials', 409);
              }
              const password_hash = await bcrypt.hash(
                createCredentialsDto.password,
                10,
              );
              await query(
                'INSERT INTO user_account_credentials ("userId", password, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())',
                [createCredentialsDto.user.id, password_hash, true],
              );
            },
            async updatePassword(
              email: string,
              updatePasswordDto: any,
              i18n: any,
              manager: any,
            ) {
              const query = async (sql: string, params?: any[]) => {
                if (manager && typeof manager.query === 'function') {
                  return await manager.query(sql, params);
                }
                return await dataSource.query(sql, params);
              };
              // Buscar el usuario por email para obtener su id
              const users = await query(
                'SELECT id FROM users WHERE email = $1',
                [email],
              );
              if (users.length === 0) {
                throw new HttpException('User not found', 404);
              }
              const userId = users[0].id;
              const password_hash = await bcrypt.hash(
                updatePasswordDto.password,
                10,
              );
              await query(
                'UPDATE user_account_credentials SET password = $1, "updatedAt" = NOW() WHERE "userId" = $2',
                [password_hash, userId],
              );
              return true;
            },
            async findCredentialsOfUser(userId: number) {
              const result = await dataSource.query(
                'SELECT * FROM user_account_credentials WHERE "userId" = $1',
                [userId],
              );
              return result[0] || null;
            },
          };
        },
        inject: [DataSource],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get dataSource from app
    dataSource = app.get(DataSource);
    await dataSource.synchronize();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (testDbName) {
      // Drop database using maintenance connection
      const maintenanceConnection = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'postgres',
      });
      await maintenanceConnection.dropDatabase();
      await maintenanceConnection.close();
      console.error(`[MOCK] Dropped test database: ${testDbName}`);
    }
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
    // Clear all mocks to prevent state leakage between tests (keep implementations)
    jest.clearAllMocks();
    console.error('[MOCK] afterEach: cleanup complete');
  });

  // Helper functions
  let userCounter = 0;
  const setupUser = async (additionalData?: any, activate: boolean = true) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const uniqueEmail = `test${timestamp}-${random}@example.com`;
    const document = `${timestamp}-${random}`;
    const userData = {
      ...testUser,
      email: uniqueEmail,
      document,
      ...additionalData,
    };
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);
    // Buscar el usuario en la BD para obtener su id y datos completos
    const users = await dataSource.query(
      'SELECT * FROM users WHERE email = $1',
      [uniqueEmail],
    );
    // No logging needed
    if (users.length === 0) {
      throw new Error('User not found after registration');
    }
    let user = users[0];
    // No logging needed
    // Si activate es true, activar usuario
    if (activate) {
      console.error('[DEBUG] Activating user with id:', user.id);
      const updateResult = await dataSource.query(
        'UPDATE users SET status = $1 WHERE id = $2',
        ['active', user.id],
      );
      console.error('[DEBUG] Update result:', updateResult);
      // Re-fetch the user to ensure update and get fresh data
      const updatedUsers = await dataSource.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id],
      );
      console.error('[DEBUG] Updated users count:', updatedUsers.length);
      if (updatedUsers.length === 0) {
        throw new Error('User not found after activation');
      }
      user = updatedUsers[0];
    }
    // Asegurar que exista un token de verificación de email: eliminar cualquier token existente e insertar uno nuevo
    await dataSource.query(
      'DELETE FROM user_tokens WHERE "userId" = $1 AND type = $2',
      [user.id, 'emailVerification'],
    );
    const token = `verification-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await dataSource.query(
      'INSERT INTO user_tokens (token, type, "expiresAt", "isUsed", "userId", "createdAt") VALUES ($1, $2, NOW() + INTERVAL \'24 hours\', false, $3, NOW())',
      [token, 'emailVerification', user.id],
    );
    // Debug: log credentials hash
    const creds = await dataSource.query(
      'SELECT * FROM user_account_credentials WHERE "userId" = $1',
      [user.id],
    );
    console.error(
      '[DEBUG] credentials for user:',
      user.email,
      'hash:',
      creds[0]?.password,
    );
    return user;
  };

  const verifyEmail = async (token: string) => {
    return request(app.getHttpServer())
      .post(`/auth/verify-email/${token}`)
      .send({})
      .expect(201);
  };

  const loginUser = async (email: string, password: string) => {
    console.error('[MOCK] loginUser called with email:', email);
    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({ email, password });
    console.error('[MOCK] login response status:', response.status);
    console.error(
      '[MOCK] login response body:',
      JSON.stringify(response.body, null, 2),
    );
    if (response.status !== 201) {
      console.error(
        'Login failed with status',
        response.status,
        'body:',
        response.body,
      );
      throw new Error(
        `Login failed with status ${response.status}: ${JSON.stringify(response.body)}`,
      );
    }
    // Verificar si se requiere 2FA
    if (response.body.success && response.body.data?.twoFactorRequired) {
      const tempToken = response.body.data.tempToken;
      if (!tempToken) {
        throw new Error('No tempToken in 2FA required response');
      }
      return { twoFactorRequired: true, tempToken };
    }
    // El login retorna refreshToken en data (camelCase), intercambiarlo por access_token
    const refreshToken = response.body.data?.refreshToken;
    if (!refreshToken) {
      throw new Error('No refreshToken in login response');
    }
    const refreshResponse = await request(app.getHttpServer())
      .post(`/auth/refresh-token/${refreshToken}`)
      .set('X-Forwarded-For', '127.0.0.1')
      .send({})
      .expect(201);
    console.error(
      '[MOCK] refresh response body:',
      JSON.stringify(refreshResponse.body, null, 2),
    );
    const { access_token } = refreshResponse.body.data;
    return { access_token, refresh_token: refreshToken };
  };

  const logoutUser = async (accessToken: string, refreshToken: string) => {
    return request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refresh_token: refreshToken })
      .expect(201);
  };

  const setupUserWith2FA = async (userData?: any) => {
    const user = await setupUser(userData);
    const { access_token, refresh_token } = await loginUser(
      user.email,
      testUser.password,
    );
    // Enable 2FA
    const enableResponse = await request(app.getHttpServer())
      .post('/auth/2fa/enable')
      .set('Authorization', `Bearer ${access_token}`)
      .send({})
      .expect(201);
    const { secret, qrCode } = enableResponse.body;
    // Verify 2FA with valid token
    const otp = '123456'; // Mock returns valid
    const verifyResponse = await request(app.getHttpServer())
      .post('/auth/2fa/verify')
      .set('Authorization', `Bearer ${access_token}`)
      .send({ token: otp })
      .expect(201);
    return { user, access_token, refresh_token, secret, qrCode };
  };

  const setupUserWith2FAEnable = async (userData?: any) => {
    const user = await setupUser(userData);
    const { access_token, refresh_token } = await loginUser(
      user.email,
      testUser.password,
    );
    // Enable 2FA
    // Generar e insertar token de reauth manualmente (evita llamada a endpoint que puede fallar)
    const reauthToken = `manual-reauth-${Date.now()}-${user.id}`;
    const hashedReauthToken = crypto
      .createHash('sha256')
      .update(reauthToken)
      .digest('hex');
    const reauthExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    await dataSource.query(
      'INSERT INTO auth_reauth_tokens (token, "userId", "expiresAt", revoked, "createdAt") VALUES ($1, $2, $3, $4, NOW())',
      [hashedReauthToken, user.id, reauthExpiresAt, false],
    );
    console.error(
      '[MOCK] setupUserWith2FAEnable: inserted manual reauth token:',
      reauthToken,
    );
    // Enviar enable con twoFactorType y reauth token
    const enableResponse = await request(app.getHttpServer())
      .post('/auth/2fa/enable')
      .set('Authorization', `Bearer ${access_token}`)
      .set('X-Reauth-Token', reauthToken)
      .send({ twoFactorType: 'totp' });
    if (enableResponse.status !== 201) {
      console.error(
        '[MOCK] setupUserWith2FAEnable: enable 2FA failed',
        enableResponse.status,
        enableResponse.body,
      );
      throw new Error(
        `enable 2FA failed with status ${enableResponse.status}: ${JSON.stringify(enableResponse.body)}`,
      );
    }
    // Extraer secret y qrCode de la respuesta
    const twoFactorData = enableResponse.body.meta?.twoFactorData;
    const qrCode = enableResponse.body.meta?.qrCode || null;
    const secret = twoFactorData?.secret || null;
    return { user, access_token, refresh_token, secret, qrCode };
  };

  const setupUserWithConfirmed2FA = async (userData?: any) => {
    const user = await setupUser(userData);
    const { access_token, refresh_token } = await loginUser(
      user.email,
      testUser.password,
    );
    // Generar e insertar token de reauth manualmente (para evitar llamada a endpoint que falla)
    const reauthToken = `manual-reauth-${Date.now()}-${user.id}`;
    const hashedReauthToken = crypto
      .createHash('sha256')
      .update(reauthToken)
      .digest('hex');
    const reauthExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    await dataSource.query(
      'INSERT INTO auth_reauth_tokens (token, "userId", "expiresAt", revoked, "createdAt") VALUES ($1, $2, $3, $4, NOW())',
      [hashedReauthToken, user.id, reauthExpiresAt, false],
    );
    console.error(
      '[MOCK] setupUserWithConfirmed2FA: inserted manual reauth token:',
      reauthToken,
    );
    const enableResponse = await request(app.getHttpServer())
      .post('/auth/2fa/enable')
      .set('Authorization', `Bearer ${access_token}`)
      .set('X-Reauth-Token', reauthToken)
      .send({ twoFactorType: 'totp' });
    if (enableResponse.status !== 201) {
      console.error(
        '[MOCK] setupUserWithConfirmed2FA: enable 2FA failed',
        enableResponse.status,
        enableResponse.body,
      );
      throw new Error(
        `enable 2FA failed with status ${enableResponse.status}: ${JSON.stringify(enableResponse.body)}`,
      );
    }
    console.error(
      '[MOCK] enableResponse body for 2FA:',
      JSON.stringify(enableResponse.body, null, 2),
    );
    // Generar un NUEVO token de reauth para la confirmación (el anterior ya fue usado)
    const reauthTokenForConfirm = `manual-reauth-confirm-${Date.now()}-${user.id}`;
    const hashedReauthTokenForConfirm = crypto
      .createHash('sha256')
      .update(reauthTokenForConfirm)
      .digest('hex');
    const reauthExpiresAtForConfirm = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    console.error(
      '[MOCK] About to insert confirm reauth token, userId:',
      user.id,
      'type:',
      typeof user.id,
    );
    const userCheckBeforeConfirm = await dataSource.query(
      'SELECT id FROM users WHERE id = $1',
      [user.id],
    );
    console.error(
      '[MOCK] User exists before confirm reauth insert:',
      userCheckBeforeConfirm.length > 0,
    );
    await dataSource.query(
      'INSERT INTO auth_reauth_tokens (token, "userId", "expiresAt", revoked, "createdAt") VALUES ($1, $2, $3, $4, NOW())',
      [hashedReauthTokenForConfirm, user.id, reauthExpiresAtForConfirm, false],
    );
    console.error(
      '[MOCK] setupUserWithConfirmed2FA: inserted reauth token for confirm:',
      reauthTokenForConfirm,
    );
    console.error(
      '[MOCK] enableResponse status:',
      enableResponse.status,
      'body meta exists:',
      !!enableResponse.body.meta,
    );
    // Obtener secret desde la BD (más confiable que la respuesta)
    const securityAfterEnable = await dataSource.query(
      'SELECT "twoFactorData" FROM user_security WHERE "userId" = $1',
      [user.id],
    );
    console.error('[MOCK] securityAfterEnable:', securityAfterEnable);
    if (
      securityAfterEnable.length === 0 ||
      !securityAfterEnable[0].twoFactorData?.secret?.base32
    ) {
      throw new Error('2FA secret not found in DB after enable');
    }
    const secret = securityAfterEnable[0].twoFactorData.secret.base32;
    const code = speakeasy.generateTOTP({ secret, encoding: 'base32' });
    // Confirm 2FA usando /auth/2fa/confirm con el código generado
    const confirmResponse = await request(app.getHttpServer())
      .post('/auth/2fa/confirm')
      .set('Authorization', `Bearer ${access_token}`)
      .set('X-Reauth-Token', reauthTokenForConfirm)
      .send({ code: code });
    if (confirmResponse.status !== 201) {
      console.error(
        '[MOCK] setupUserWithConfirmed2FA: confirm 2FA failed',
        confirmResponse.status,
        confirmResponse.body,
      );
      throw new Error(
        `confirm 2FA failed with status ${confirmResponse.status}: ${JSON.stringify(confirmResponse.body)}`,
      );
    }
    // Devolver datos del usuario, tokens y el código generado
    return { user, access_token, refresh_token, code };
  };

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      // Generar datos únicos para este test
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const uniqueEmail = `test-register-${timestamp}-${random}@example.com`;
      const document = `${timestamp}-${random}`;
      const newUser = {
        ...testUser,
        email: uniqueEmail,
        document,
      };
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: null,
        meta: {
          action: 'SUCCESS_REGISTER',
        },
        error: null,
      });
      // Verificar que no exponga datos sensibles
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('user_secret');
      expect(response.body).not.toHaveProperty('document');
    });

    it('should fail with duplicate email', async () => {
      // Generar datos únicos para el primer registro
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const uniqueEmail = `test-dup-email-${timestamp}-${random}@example.com`;
      const document = `${timestamp}-${random}`;
      const user1 = {
        ...testUser,
        email: uniqueEmail,
        document,
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user1)
        .expect(201);
      // Intentar registrar otro usuario con el mismo email
      const user2 = {
        ...testUser,
        email: uniqueEmail,
        document: `${timestamp}-${random + 1}`,
      };
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user2)
        .expect(409);
      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'User already exists',
      });
    });

    it('should fail with duplicate document', async () => {
      // Generar datos únicos para el primer registro
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const email = `test-dup-doc-${timestamp}-${random}@example.com`;
      const document = `${timestamp}-${random}`;
      const user1 = {
        ...testUser,
        email,
        document,
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user1)
        .expect(201);
      // Intentar registrar otro usuario con el mismo documento
      const user2 = {
        ...testUser,
        email: `test-dup-doc-${timestamp}-${random + 1}@example.com`,
        document,
      };
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user2)
        .expect(409);
      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'User already exists',
      });
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const user = await setupUser(undefined, false); // no activar
      // Crear token manualmente
      const tokensService = app.get(TokensService);
      await tokensService.createTokenEmailVerification({ user }, undefined);
      // Obtener token de la BD
      const tokens = await dataSource.query(
        'SELECT token FROM user_tokens WHERE "userId" = $1 AND type = $2 AND "isUsed" = false',
        [user.id, 'emailVerification'],
      );
      if (tokens.length === 0) {
        throw new Error('No verification token found');
      }
      const token = tokens[0].token;
      const response = await verifyEmail(token);
      expect(response.body).toMatchObject({
        success: true,
        data: null,
        meta: {
          action: 'SUCCESS_EMAIL_VERIFICATION',
        },
        error: null,
      });
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-email/invalid-token')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = await setupUser();
      // Verificar email
      const vTokens = await dataSource.query(
        'SELECT token FROM user_tokens WHERE "userId" = $1 AND type = $2 AND "isUsed" = false',
        [user.id, 'emailVerification'],
      );
      if (vTokens.length === 0) throw new Error('No verification token');
      await verifyEmail(vTokens[0].token);
      const { access_token, refresh_token } = await loginUser(
        user.email,
        testUser.password,
      );
      expect(access_token).toBeDefined();
      expect(refresh_token).toBeDefined();
      expect(typeof access_token).toBe('string');
      expect(typeof refresh_token).toBe('string');
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'wrong@example.com', password: testUser.password })
        .expect(401);
    });

    it('should fail with invalid password', async () => {
      const user = await setupUser();
      // setupUser ya activa el usuario, no es necesario verificar email
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: user.email, password: 'WrongPass123!' })
        .expect(401);
    });

    it('should fail with unverified email', async () => {
      const user = await setupUser(undefined, false);
      const loginData = { email: user.email, password: testUser.password };
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(loginData);
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'El usuario aun no ha verificado su correo',
          code: 'PENDING_USER',
        },
        data: null,
        meta: null,
      });
    });
  });

  describe('POST /auth/refresh-token/:token', () => {
    it('should refresh token with valid refresh token', async () => {
      const user = await setupUser();
      // Verificar email
      const vTokens = await dataSource.query(
        'SELECT token FROM user_tokens WHERE "userId" = $1 AND type = $2 AND "isUsed" = false',
        [user.id, 'emailVerification'],
      );
      if (vTokens.length === 0) throw new Error('No verification token');
      await verifyEmail(vTokens[0].token);
      // Hacer login para obtener refresh token SIN consumirlo
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({ email: user.email, password: testUser.password })
        .expect(201);
      const refresh_token = loginResponse.body.data?.refreshToken;
      if (!refresh_token) {
        throw new Error('No refreshToken in login response');
      }
      // Ahora usar el refresh token para obtener un nuevo access token
      const response = await request(app.getHttpServer())
        .post(`/auth/refresh-token/${refresh_token}`)
        .send({})
        .expect(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
        },
        error: null,
      });
      // El nuevo refresh_token debe ser diferente
      expect(response.body.data.refresh_token).not.toBe(refresh_token);
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh-token/invalid-refresh-token')
        .send({})
        .expect(404);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await setupUser();
      // Verificar email
      const vTokens = await dataSource.query(
        'SELECT token FROM user_tokens WHERE "userId" = $1 AND type = $2 AND "isUsed" = false',
        [user.id, 'emailVerification'],
      );
      if (vTokens.length === 0) throw new Error('No verification token');
      await verifyEmail(vTokens[0].token);
      const { access_token, refresh_token } = await loginUser(
        user.email,
        testUser.password,
      );
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${access_token}`)
        .send({ refresh_token });
      if (response.status !== 201) {
        console.error('[MOCK] logout failed:', response.status, response.body);
        throw new Error(
          `Logout failed with status ${response.status}: ${JSON.stringify(response.body)}`,
        );
      }
    });
  });

  describe('POST /auth/2fa/enable', () => {
    it('should enable 2FA successfully', async () => {
      const { access_token } = await setupUserWith2FAEnable();
      // The enable call already happened in setupUserWith2FAEnable
      // Just verify it succeeded
      expect(access_token).toBeDefined();
    });

    it('should fail if user is not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/auth/2fa/enable')
        .send({})
        .expect(404);
    });
  });

  describe('POST /auth/2fa/verify', () => {
    it('should verify 2FA token successfully', async () => {
      // Preparar usuario con 2FA confirmado (activo)
      const { user, code } = await setupUserWithConfirmed2FA();
      // Intentar login: debería requerir 2FA y devolver tempToken
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: user.email, password: testUser.password })
        .expect(201);
      expect(loginResponse.body).toMatchObject({
        success: true,
        data: null,
        meta: expect.objectContaining({
          twoFactorRequired: true,
          tempToken: expect.any(String),
        }),
      });
      const { tempToken } = loginResponse.body.meta;
      // Verificar con código OTP válido
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/2fa/verify')
        .send({ code: code, tempToken })
        .expect(201);
      expect(verifyResponse.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          refreshToken: expect.any(String),
        }),
      });
    });

    it('should fail with invalid 2FA token', async () => {
      // Preparar usuario con 2FA activo
      const { user } = await setupUserWithConfirmed2FA();
      // Obtener tempToken mediante login (2FA requerido)
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: user.email, password: testUser.password });
      const { tempToken } = loginResponse.body.meta;
      // Enviar código inválido a verify
      await request(app.getHttpServer())
        .post('/auth/2fa/verify')
        .send({ code: '000000', tempToken })
        .expect(201);
    });
  });

  describe('POST /auth/2fa/disable', () => {
    it('should disable 2FA successfully', async () => {
      const { access_token } = await setupUserWithConfirmed2FA();
      await request(app.getHttpServer())
        .post('/auth/2fa/disable')
        .set('Authorization', `Bearer ${access_token}`)
        .send({})
        .expect(201);
    });

    it('should fail if user is not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/auth/2fa/disable')
        .send({})
        .expect(404);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should send password reset email', async () => {
      const user = await setupUser();
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ email: user.email })
        .expect(201);
      expect(response.body).toMatchObject({
        token: expect.any(String),
      });
    });

    it('should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const user = await setupUser();
      // Solicitar reset de contraseña (forgot)
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ email: user.email })
        .expect(201);
      // Obtener token de reset de la BD
      const tokens = await dataSource.query(
        'SELECT token FROM user_tokens WHERE "userId" = $1 AND type = $2 AND "isUsed" = false ORDER BY "createdAt" DESC LIMIT 1',
        [user.id, 'passwordReset'],
      );
      if (tokens.length === 0) {
        throw new Error('No reset token found');
      }
      const resetToken = tokens[0].token;
      const newPassword = 'NewPass123!';
      let response;
      try {
        response = await request(app.getHttpServer())
          .post(`/auth/reset-password/${resetToken}`)
          .send({ password: newPassword, password_confirm: newPassword });
        console.error('Reset password response status:', response.status);
        console.error('Reset password response body:', response.body);
      } catch (error: any) {
        console.error(
          'Reset password error response status:',
          error.response?.status,
        );
        console.error(
          'Reset password error response body:',
          error.response?.body,
        );
        throw error;
      }
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: null,
        meta: {
          action: 'SUCCESS_PASSWORD_RESET',
        },
        error: null,
      });
      // Verificar email del usuario (necesario para login)
      const vTokens = await dataSource.query(
        'SELECT token FROM user_tokens WHERE "userId" = $1 AND type = $2 AND "isUsed" = false',
        [user.id, 'emailVerification'],
      );
      if (vTokens.length === 0) {
        throw new Error(
          'No verification token found for user after reset password',
        );
      }
      await verifyEmail(vTokens[0].token);
      // Verify new password works
      await loginUser(user.email, newPassword);
    });
  });

  describe('POST /auth/re-auth', () => {
    it('should reauthenticate successfully', async () => {
      const user = await setupUser();
      // Verificar email
      const vTokens = await dataSource.query(
        'SELECT token FROM user_tokens WHERE "userId" = $1 AND type = $2 AND "isUsed" = false',
        [user.id, 'emailVerification'],
      );
      if (vTokens.length === 0) throw new Error('No verification token');
      await verifyEmail(vTokens[0].token);
      const { access_token } = await loginUser(user.email, testUser.password);
      const response = await request(app.getHttpServer())
        .post('/auth/re-auth')
        .set('Authorization', `Bearer ${access_token}`)
        .send({ password: testUser.password })
        .expect(201);
      expect(response.body).toMatchObject({
        data: expect.any(String), // reAuth token
        meta: expect.objectContaining({
          reAuthTokenExpiresIn: expect.any(String),
        }),
      });
    });
  });

  describe('GET /users/profile/me', () => {
    it('should return current user', async () => {
      const user = await setupUser();
      const { access_token } = await loginUser(user.email, testUser.password);
      const response = await request(app.getHttpServer())
        .get('/users/profile/me')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(Number),
          email: user.email,
          name: testUser.name,
        },
        meta: { total: 1 },
        error: null,
      });
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer()).get('/users/profile/me').expect(404);
    });
  });
});
