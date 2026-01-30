import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuthSessions } from 'src/modules/auth/entities/auth-sessions.entity';

@Entity('auth_refresh_tokens')
export class AuthRefreshTokens {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => AuthSessions,
    (authSessions) => authSessions.authRefreshTokens,
    {
      eager: true,
      onDelete: 'CASCADE',
    },
  )
  authSession: AuthSessions;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;
}
