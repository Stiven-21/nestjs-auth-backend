import { Logger } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { AppDataSource } from 'src/database/data-source';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { UserAccountCredentials } from 'src/modules/users/entities/user-account-credentials.entity';
import { UserStatusEnum } from 'src/common/enum/user-status.enum';
import * as bcrypt from 'bcryptjs';

const logger = new Logger('userSeeder');

export async function runUserSeeder() {
  const roleRepository = AppDataSource.getRepository(Role);

  const superAdminRol = await roleRepository.findOneBy({ name: 'super_admin' });

  if (!superAdminRol) {
    logger.debug('📚 No super admin role found, creating...');
    await roleRepository.save({
      name: 'super_admin',
      permissions: ['all'],
    });
  }
  const userRepository = AppDataSource.getRepository(User);

  let existing = await userRepository.findOne({
    where: { role: { name: 'super_admin' } },
    relations: ['role'],
  });

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!existing) {
    logger.debug('📚 No super admin user found, creating...');

    if (!email || !password) {
      logger.error('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is not set');
      return;
    }

    if (password.length < 8) {
      logger.error('SUPER_ADMIN_PASSWORD must be at least 8 characters');
      return;
    }

    if (password.length > 16) {
      logger.error('SUPER_ADMIN_PASSWORD must be at most 32 characters');
      return;
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      logger.error('📚 SUPER_ADMIN_EMAIL is not a valid email');
      return;
    }

    const user_secret = uuidv7();

    existing = await userRepository.save({
      name: 'Super',
      lastname: 'Admin',
      email,
      user_secret,
      role: superAdminRol,
      status: UserStatusEnum.ACTIVE,
    });
  }

  const creedentials = AppDataSource.getRepository(UserAccountCredentials);
  const existCredentials = await creedentials.findOne({
    where: { user: { id: existing.id } },
  });

  if (!existCredentials) {
    await creedentials.save({
      user: existing,
      password: await bcrypt.hash(password, 10),
    });
  }

  logger.debug('✅ User seeded successfully');
}
