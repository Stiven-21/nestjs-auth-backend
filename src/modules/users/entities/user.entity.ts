import { IdentityType } from 'src/modules/users/entities/identity-type.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserToken } from './user-tokens.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { UserStatusEnum } from 'src/common/enum/user-status.enum';
import { UserSession } from './user-session.entity';
import { UserAccountOAuth } from './user-account-oauth.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  avatar: string;

  @Column({ nullable: false, length: 20, type: 'varchar' })
  name: string;

  @Column({ nullable: true, length: 20, type: 'varchar' })
  lastname: string;

  @ManyToOne(() => IdentityType, (identityType) => identityType.id, {
    eager: true,
    nullable: true,
  })
  identityType: IdentityType;

  @Column({ unique: true, nullable: true, length: 20, type: 'varchar' })
  document: string;

  @Column({ unique: true, nullable: false, length: 100, type: 'varchar' })
  email: string;

  // Proximamente será removido
  @Column({ unique: true, nullable: true, type: 'text', select: false })
  password: string;

  @ManyToOne(() => Role, (role) => role.id, { eager: true })
  role: Role;

  @Column({
    nullable: false,
    enum: UserStatusEnum,
    default: UserStatusEnum.PENDING,
  })
  status: UserStatusEnum;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
    select: false,
  })
  user_secret: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => UserToken, (userToken) => userToken.user)
  userTokens: UserToken[];

  @OneToMany(() => UserSession, (userSession) => userSession.user)
  userSessions: UserSession[];

  @OneToMany(
    () => UserAccountOAuth,
    (userAccountOAuth) => userAccountOAuth.user,
  )
  userAccountOauths: UserAccountOAuth[];
}
