import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UserTokenEnum } from 'src/common/enum/user-token.enum';

@Entity('user_tokens')
export class UserToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userTokens, {
    eager: true,
  })
  user: User;

  @Column({ nullable: false, type: 'varchar', length: 255 })
  token: string;

  @Column({ nullable: false, enum: UserTokenEnum })
  type: UserTokenEnum;

  @Column({ nullable: false, type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: false, type: 'boolean', default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
