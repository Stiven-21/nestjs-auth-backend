import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_email_change_request')
export class UserEmailChangeRequest {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => User, (user) => user.userEmailChangeRequests, {
    onDelete: 'CASCADE',
    eager: true,
  })
  user: User;

  @Column({ nullable: false, type: 'varchar' })
  oldEmail: string;

  @Column({ nullable: false, type: 'varchar' })
  newEmail: string;

  @Column({ nullable: false, type: 'text' })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: false, nullable: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
