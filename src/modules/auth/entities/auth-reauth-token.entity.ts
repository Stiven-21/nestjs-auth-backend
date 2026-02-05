import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';

@Index(['user'])
@Entity('auth_reauth_tokens')
export class AuthReAuthToken {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => User, (user) => user.authReauthTokens)
  user: User;

  @Column({ type: 'text', nullable: false })
  token: string;

  @Column({ nullable: false, type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  usedAt: Date | null;

  @Column({ nullable: false, type: 'boolean', default: false })
  revoked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
