import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('identity_types')
export class IdentityType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false, length: 20 })
  name: string;

  @Column({ unique: true, nullable: false, length: 5 })
  abrev: string;

  @OneToMany(() => User, (user) => user.identityType)
  users: User[];
}
