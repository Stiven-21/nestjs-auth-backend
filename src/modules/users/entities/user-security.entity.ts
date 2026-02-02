import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';
import { UserSecurityRecoveryCodes } from 'src/modules/users/entities/user_security_recovery_codes.entity';

@Entity('user_security')
export class UserSecurity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.security, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ default: false, type: 'boolean' })
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

  @OneToMany(
    () => UserSecurityRecoveryCodes,
    (userSecurityRecoveryCodes) => userSecurityRecoveryCodes.userSecurity,
  )
  recoveryCodesList: UserSecurityRecoveryCodes[];
}
