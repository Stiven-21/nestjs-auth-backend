import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('auth_attempts')
@Index(['email'], { unique: true })
export class AuthAttempts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column()
  ipAddress: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  blockedUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
