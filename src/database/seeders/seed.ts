import { Logger } from '@nestjs/common';
import { AppDataSource } from 'src/database/data-source';
import { runRoleSeeder } from 'src/database/seeders/role.seeder';
import { runUserSeeder } from 'src/database/seeders/user.seeder';
import { runPolicityPasswordSeeder } from 'src/database/seeders/policity-password.seeder';
import { runIdentityTypesSeeder } from './identity-types.seeder';

const logger = new Logger('seeders');

async function runSeeders() {
  await AppDataSource.initialize();

  logger.debug('📚 Database connected');

  logger.debug('🌱 Running seeders...');

  await runIdentityTypesSeeder();
  await runRoleSeeder();
  await runUserSeeder();
  await runPolicityPasswordSeeder();

  logger.debug('✅ Seeders executed successfully');
}

runSeeders()
  .catch((error) => {
    logger.error('❌ Seeder error:', error);
  })
  .finally(() => {
    AppDataSource.destroy();
    logger.debug('📚 Database connection closed');
  });
