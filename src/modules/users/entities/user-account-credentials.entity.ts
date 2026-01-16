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

@Entity({ name: 'user_account_credentials' })
export class UserAccountCredentials {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.userAccountCredentials, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  user: User;

  @Column({ type: 'text', select: false })
  password: string;

  @Column({ default: true, type: 'boolean', nullable: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
