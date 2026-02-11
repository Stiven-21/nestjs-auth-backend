import { readFileSync } from 'fs';
import { join } from 'path';

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
);

export const swaggerConfig = {
  title: 'NestAuth',
  description:
    'NestAuth es un proyecto open-source que provee un sistema de autenticación modular, extensible y reutilizable, construido con NestJS. Está diseñado como una base sólida para cualquier tipo de aplicación (web, mobile, SaaS, eCommerce, APIs internas), permitiendo integrar autenticación segura y escalable sin acoplarse a un dominio específico.El proyecto implementa autenticación local (email/contraseña), OAuth con múltiples proveedores, gestión avanzada de usuarios, roles, permisos, sesiones y envío de correos transaccionales con plantillas. Incluye internacionalización (i18n), validación estandarizada y respuestas uniformes para facilitar su consumo desde cualquier frontend.',
  version: packageJson.version,
};
