import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { LocationInfo } from 'src/common/interfaces/location-info.interface';

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

  // Mas adelante dividir country y city para mejor auditoria
  @Column({ nullable: true, type: 'jsonb' })
  location: LocationInfo | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: false, type: 'timestamp' })
  expiresAt: Date;
}
