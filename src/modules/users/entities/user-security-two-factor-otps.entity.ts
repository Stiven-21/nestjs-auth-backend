import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { TwoFactorOtpsType } from 'src/common/enum/two-factor-otps.enum';

@Entity('user_security_two_factor_otps')
export class UserSecurityTwoFactorOtps {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userSecurityTwoFactorOtps, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'enum', enum: TwoFactorOtpsType })
  type: TwoFactorOtpsType;

  @Column({ type: 'varchar', length: 8, nullable: false })
  code: string;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @Column({ type: 'int', default: 0 })
  failedAttempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
