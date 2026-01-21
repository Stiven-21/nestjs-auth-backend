import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';

@Entity('user_security')
export class UserSecurity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.security, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({
    type: 'enum',
    enum: TwoFactorType,
    nullable: true,
    default: null,
  })
  twoFactorType: TwoFactorType;

  // Datos cifrados según el tipo de 2FA
  @Column({ type: 'jsonb', nullable: true, default: null })
  twoFactorData: Record<string, any>;

  // Hashes de recovery codes
  @Column({ type: 'jsonb', nullable: true, default: null })
  recoveryCodes: string[];

  @Column({ default: 0 })
  failed_2fa_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastChangedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
