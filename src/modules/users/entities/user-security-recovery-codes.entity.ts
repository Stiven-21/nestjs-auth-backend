import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserSecurity } from 'src/modules/users/entities/user-security.entity';

@Entity('user_security_recovery_codes')
export class UserSecurityRecoveryCodes {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserSecurity, (userSecurity) => userSecurity.recoveryCodes, {
    onDelete: 'CASCADE',
  })
  userSecurity: UserSecurity;

  @Column({ type: 'varchar', length: 10, nullable: false })
  code: string;

  @Column({ nullable: false, type: 'boolean', default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
