import { readFileSync } from 'fs';
import { join } from 'path';

export const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
);

export const swaggerConfig = {
  title: 'NestAuth API',
  description:
    'API de autenticación y gestión de usuarios modular y escalable. NestAuth provee una base sólida para aplicaciones modernas, integrando autenticación local, OAuth (Google, Facebook, GitHub), gestión avanzada de roles/permisos (RBAC), sesiones concurrentes, autenticación de dos factores (2FA) y auditoría completa de eventos. Diseñado para ser agnóstico al dominio y fácilmente integrable con cualquier frontend.',
  version: packageJson.version,
  contact: {
    name: 'Soporte NestAuth',
    url: 'https://github.com/Stiven-21/nestjs-auth-backend',
    email: 'support@nestauth.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
};
