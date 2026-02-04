import { AuditEvent } from 'src/common/enum/audit-event.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'enum', enum: AuditEvent, nullable: false })
  event: AuditEvent;

  @Column({ nullable: true })
  actorId?: number;

  @Column({ nullable: true })
  targetId?: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  ip?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;
}
