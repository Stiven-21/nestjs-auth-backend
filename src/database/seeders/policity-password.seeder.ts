import { Logger } from '@nestjs/common';
import { AuthPasswordPolicy } from 'src/modules/auth/entities/auth-password-policy.entity';
import { AppDataSource } from 'src/database/data-source';

const logger = new Logger('policityPasswordSeeder');

export async function runPolicityPasswordSeeder() {
  const policityRepository = AppDataSource.getRepository(AuthPasswordPolicy);

  const existing = await policityRepository.findOneBy({});

  if (!existing) {
    logger.debug('📚 No policity password found, creating...');
    await policityRepository.save({ isActive: true });
    logger.debug('Policity password created seeded');
  }

  logger.debug('✅ Policity password executed successfully');
}
