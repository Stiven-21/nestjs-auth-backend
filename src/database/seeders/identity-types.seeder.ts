import { IdentityType } from 'src/modules/users/entities/identity-type.entity';
import { AppDataSource } from 'src/database/data-source';
import { Logger } from '@nestjs/common';

const logger = new Logger('identityTypesSeeder');

export async function runIdentityTypesSeeder() {
  const identityTypeRepository = AppDataSource.getRepository(IdentityType);

  const identityTypes = [
    { name: 'Cédula de Ciudadanía', abrev: 'CC' },
    { name: 'Tarjeta de Identidad', abrev: 'TI' },
    { name: 'Cédula de Extranjería', abrev: 'CE' },
    { name: 'Pasaporte', abrev: 'PP' },
    { name: 'Registro Civil', abrev: 'RC' },
    { name: 'Número de Identificación Tributaria', abrev: 'NIT' },
    { name: 'Permiso Especial de Permanencia', abrev: 'PEP' },
    { name: 'Permiso por Protección Temporal', abrev: 'PPT' },
    { name: 'Salvoconducto de Permanencia', abrev: 'SC' },
  ];

  for (const identityType of identityTypes) {
    const existingIdentityType = await identityTypeRepository.findOneBy({
      name: identityType.name,
    });
    if (!existingIdentityType) {
      await identityTypeRepository.save(identityType);
      logger.debug(`IdentityType created ${identityType.name} seeded`);
    }
  }

  logger.debug('✅ IdentityTypes executed successfully');
}
