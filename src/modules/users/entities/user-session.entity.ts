import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userSessions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ nullable: false, type: 'varchar', length: 50 })
  ip: string;

  @Column({ nullable: false, type: 'text' })
  device: string;

  @Column({ nullable: false, type: 'text' })
  userAgent: string;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: false, type: 'timestamp' })
  expiresAt: Date;
}
