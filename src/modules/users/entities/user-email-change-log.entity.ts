import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('user_email_change_logs')
export class UserEmailChangeLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.emailChangeLogs, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: false })
  oldEmail: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  newEmail: string;

  @Column({ unique: true, type: 'varchar', length: 255, nullable: false })
  rollbackToken: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
