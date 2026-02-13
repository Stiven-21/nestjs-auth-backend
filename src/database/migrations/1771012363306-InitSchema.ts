import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1771012363306 implements MigrationInterface {
    name = 'InitSchema1771012363306'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "identity_types" ("id" SERIAL NOT NULL, "name" character varying(20) NOT NULL, "abrev" character varying(5) NOT NULL, CONSTRAINT "UQ_0be8784843b8f3a25b1941f1dab" UNIQUE ("name"), CONSTRAINT "UQ_6f9ef887942c5d4774ac49640a0" UNIQUE ("abrev"), CONSTRAINT "PK_31aaa225433b9b5a86da90147ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_tokens" ("id" SERIAL NOT NULL, "token" character varying(255) NOT NULL, "type" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_63764db9d9aaa4af33e07b2f4bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying(20) NOT NULL, "permissions" text NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" SERIAL NOT NULL, "ip" character varying(50) NOT NULL, "device" text NOT NULL, "userAgent" text NOT NULL, "location" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP NOT NULL, "userId" integer, CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_account_oauth_provider_enum" AS ENUM('google', 'facebook', 'github')`);
        await queryRunner.query(`CREATE TABLE "user_account_oauth" ("id" SERIAL NOT NULL, "provider" "public"."user_account_oauth_provider_enum" NOT NULL, "providerId" character varying(255) NOT NULL, "avatar" character varying(255), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_ee35b452f10bba1205ed4c434d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_account_credentials" ("id" SERIAL NOT NULL, "password" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "REL_66280d998e2e9cc597c0485557" UNIQUE ("userId"), CONSTRAINT "PK_a891c1f173e92e9ef16864cfcc7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_security_recovery_codes" ("id" SERIAL NOT NULL, "code" character varying(10) NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userSecurityId" integer, CONSTRAINT "PK_8a6174aebf3261b95d86bc1f053" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_security_twofactortype_enum" AS ENUM('totp', 'sms', 'email', 'fido2')`);
        await queryRunner.query(`CREATE TABLE "user_security" ("id" SERIAL NOT NULL, "twoFactorEnabled" boolean NOT NULL DEFAULT false, "twoFactorType" "public"."user_security_twofactortype_enum", "twoFactorData" jsonb, "recoveryCodes" jsonb, "failed_2fa_attempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP, "lastChangedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "REL_2c6ad367fcb763798ea480097b" UNIQUE ("userId"), CONSTRAINT "PK_93872b376b45c4ef21b6ace7314" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_email_change_logs" ("id" SERIAL NOT NULL, "oldEmail" character varying(100) NOT NULL, "newEmail" character varying(100) NOT NULL, "rollbackToken" character varying(255) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_80ecb33280fab416dbe3afa4c4e" UNIQUE ("rollbackToken"), CONSTRAINT "PK_cc6ba6d0a830f76fabf6c391e68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_refresh_tokens" ("id" SERIAL NOT NULL, "token" text NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authSessionId" integer, CONSTRAINT "PK_df6893d2063a4ea7bbf1eda31e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_sessions" ("id" SERIAL NOT NULL, "deviceId" character varying NOT NULL, "userAgent" character varying NOT NULL, "ipAddress" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_security_two_factor_otps_type_enum" AS ENUM('sms', 'email')`);
        await queryRunner.query(`CREATE TABLE "user_security_two_factor_otps" ("id" SERIAL NOT NULL, "type" "public"."user_security_two_factor_otps_type_enum" NOT NULL, "code" character varying(255) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "failedAttempts" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_fdf1d3a68e7411ab817b4e4620f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_reauth_tokens" ("id" SERIAL NOT NULL, "token" text NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "revoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_7b2ec5b515f8d35d40b89b34d6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f1bf399eb08a36e7a1bd7013ac" ON "auth_reauth_tokens" ("userId") `);
        await queryRunner.query(`CREATE TABLE "user_email_change_request" ("id" SERIAL NOT NULL, "oldEmail" character varying NOT NULL, "newEmail" character varying NOT NULL, "tokenHash" text NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_9e31f49af57ddab49f390608870" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "avatar" character varying(255), "name" character varying(20) NOT NULL, "lastname" character varying(20), "document" character varying(20), "email" character varying(100) NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "user_secret" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "identityTypeId" integer, "roleId" integer, CONSTRAINT "UQ_c1b20b2a1883ed106c3e746c25a" UNIQUE ("document"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_1b9c8f4ee0c178ac545c22e7159" UNIQUE ("user_secret"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_password_policy" ("id" SERIAL NOT NULL, "minLength" integer NOT NULL DEFAULT '8', "maxLength" integer NOT NULL DEFAULT '16', "requireUppercase" boolean NOT NULL DEFAULT true, "requireLowercase" boolean NOT NULL DEFAULT true, "requireNumbers" boolean NOT NULL DEFAULT true, "requireSpecial" boolean NOT NULL DEFAULT true, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d9d09ac6056576edd6936f920a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_attempts" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "ipAddress" character varying NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "blockedUntil" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d9115e02f18808834eb82b4a297" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3915da149ef6fe111c55a772c7" ON "auth_attempts" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_event_enum" AS ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_CHANGED', 'MFA_ENABLED', 'MFA_DISABLED', 'REFRESH_TOKEN_REVOKED', 'CHANGE_ROLE_USER')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "event" "public"."audit_logs_event_enum" NOT NULL, "actorId" integer, "targetId" integer, "metadata" json, "ip" character varying, "userAgent" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_tokens" ADD CONSTRAINT "FK_92ce9a299624e4c4ffd99b645b6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_55fa4db8406ed66bc7044328427" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_account_oauth" ADD CONSTRAINT "FK_93984ec89669c6cd2df192a6929" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_account_credentials" ADD CONSTRAINT "FK_66280d998e2e9cc597c04855571" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_security_recovery_codes" ADD CONSTRAINT "FK_3c625c17346bbdcb44c02144830" FOREIGN KEY ("userSecurityId") REFERENCES "user_security"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_security" ADD CONSTRAINT "FK_2c6ad367fcb763798ea480097b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_email_change_logs" ADD CONSTRAINT "FK_d519dde0b92d9a300f4da7182b5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "FK_eda8e36e1b44baf8a99712535b6" FOREIGN KEY ("authSessionId") REFERENCES "auth_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_925b24d7fc2f9324ce972aee025" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_security_two_factor_otps" ADD CONSTRAINT "FK_da37135a22f11b5e09e45ea876a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_reauth_tokens" ADD CONSTRAINT "FK_f1bf399eb08a36e7a1bd7013acb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_email_change_request" ADD CONSTRAINT "FK_fa07385b376bfd30c7a12a452b4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_fb3972810c2c77f9b6592deca54" FOREIGN KEY ("identityTypeId") REFERENCES "identity_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_fb3972810c2c77f9b6592deca54"`);
        await queryRunner.query(`ALTER TABLE "user_email_change_request" DROP CONSTRAINT "FK_fa07385b376bfd30c7a12a452b4"`);
        await queryRunner.query(`ALTER TABLE "auth_reauth_tokens" DROP CONSTRAINT "FK_f1bf399eb08a36e7a1bd7013acb"`);
        await queryRunner.query(`ALTER TABLE "user_security_two_factor_otps" DROP CONSTRAINT "FK_da37135a22f11b5e09e45ea876a"`);
        await queryRunner.query(`ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_925b24d7fc2f9324ce972aee025"`);
        await queryRunner.query(`ALTER TABLE "auth_refresh_tokens" DROP CONSTRAINT "FK_eda8e36e1b44baf8a99712535b6"`);
        await queryRunner.query(`ALTER TABLE "user_email_change_logs" DROP CONSTRAINT "FK_d519dde0b92d9a300f4da7182b5"`);
        await queryRunner.query(`ALTER TABLE "user_security" DROP CONSTRAINT "FK_2c6ad367fcb763798ea480097b1"`);
        await queryRunner.query(`ALTER TABLE "user_security_recovery_codes" DROP CONSTRAINT "FK_3c625c17346bbdcb44c02144830"`);
        await queryRunner.query(`ALTER TABLE "user_account_credentials" DROP CONSTRAINT "FK_66280d998e2e9cc597c04855571"`);
        await queryRunner.query(`ALTER TABLE "user_account_oauth" DROP CONSTRAINT "FK_93984ec89669c6cd2df192a6929"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_55fa4db8406ed66bc7044328427"`);
        await queryRunner.query(`ALTER TABLE "user_tokens" DROP CONSTRAINT "FK_92ce9a299624e4c4ffd99b645b6"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_event_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3915da149ef6fe111c55a772c7"`);
        await queryRunner.query(`DROP TABLE "auth_attempts"`);
        await queryRunner.query(`DROP TABLE "auth_password_policy"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_email_change_request"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1bf399eb08a36e7a1bd7013ac"`);
        await queryRunner.query(`DROP TABLE "auth_reauth_tokens"`);
        await queryRunner.query(`DROP TABLE "user_security_two_factor_otps"`);
        await queryRunner.query(`DROP TYPE "public"."user_security_two_factor_otps_type_enum"`);
        await queryRunner.query(`DROP TABLE "auth_sessions"`);
        await queryRunner.query(`DROP TABLE "auth_refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "user_email_change_logs"`);
        await queryRunner.query(`DROP TABLE "user_security"`);
        await queryRunner.query(`DROP TYPE "public"."user_security_twofactortype_enum"`);
        await queryRunner.query(`DROP TABLE "user_security_recovery_codes"`);
        await queryRunner.query(`DROP TABLE "user_account_credentials"`);
        await queryRunner.query(`DROP TABLE "user_account_oauth"`);
        await queryRunner.query(`DROP TYPE "public"."user_account_oauth_provider_enum"`);
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "user_tokens"`);
        await queryRunner.query(`DROP TABLE "identity_types"`);
    }

}
