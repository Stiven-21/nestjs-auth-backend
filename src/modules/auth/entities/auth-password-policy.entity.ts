import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('auth_password_policy')
export class AuthPasswordPolicy {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'int', default: 8 })
  minLength: number;

  @Column({ type: 'int', default: 16 })
  maxLength: number;

  @Column({ default: true })
  requireUppercase: boolean;

  @Column({ default: true })
  requireLowercase: boolean;

  @Column({ default: true })
  requireNumbers: boolean;

  @Column({ default: true })
  requireSpecial: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
