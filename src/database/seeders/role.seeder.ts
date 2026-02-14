import { Logger } from '@nestjs/common';
import { AppDataSource } from 'src/database/data-source';
import { Role } from 'src/modules/roles/entities/role.entity';

const logger = new Logger('roleSeeder');

export async function runRoleSeeder() {
  const roleRepository = AppDataSource.getRepository(Role);

  const roles = [
    {
      name: 'super_admin',
      permissions: ['all'],
    },
    {
      name: 'admin',
      permissions: [
        'users:read',
        'users:read:id',
        'users:update:id',
        'users:delete:id',
      ],
    },
    {
      name: 'user',
      permissions: ['users:update:id'],
    },
  ];

  for (const role of roles) {
    const existingRole = await roleRepository.findOneBy({ name: role.name });
    if (!existingRole) {
      await roleRepository.save(role);
      logger.debug(`Role created ${role.name} seeded`);
    }
  }

  logger.debug('✅ Roles seeded successfully');
}
