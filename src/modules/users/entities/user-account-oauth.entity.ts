import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_account_oauth' })
export class UserAccountOAuth {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userAccountOauths, {
    onDelete: 'CASCADE',
    eager: true,
  })
  user: User;

  @Column({ nullable: false, type: 'enum', enum: OAuthProviderEnum })
  provider: OAuthProviderEnum;

  @Column({ nullable: false, type: 'varchar', length: 255 })
  providerId: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  avatar: string;

  @Column({ default: true, type: 'boolean', nullable: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
