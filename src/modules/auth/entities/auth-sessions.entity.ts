import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthRefreshTokens } from './auth-refresh-tokens.entity';

@Entity('auth_sessions')
export class AuthSessions {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.authSessions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ unique: true, nullable: false })
  deviceId: string;

  @Column()
  userAgent: string;

  @Column()
  ipAddress: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => AuthRefreshTokens,
    (authRefreshTokens) => authRefreshTokens.authSession,
  )
  authRefreshTokens: AuthRefreshTokens[];
}
