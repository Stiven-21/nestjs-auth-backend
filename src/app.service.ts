import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { packageJson } from './config/swagger.config';
import { okResponse } from './common/exceptions';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from './common/constants/i18n.constants';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    // private readonly redisService: RedisService, // 🔒 pendiente configurar
  ) {}

  async getHealthStatus(i18n: I18nContext) {
    const checks = {
      database: await this.checkDatabase(),
      // redis: await this.checkRedis(), // 🔒 pendiente configurar
    };

    const isHealthy = Object.values(checks).every((status) => status === 'up');

    const supportedLanguages = process.env.I18N_ENABLED === 'true';

    const response = {
      status: isHealthy ? 'ok' : 'error',
      service: packageJson.name,
      version: packageJson.version,
      uptime: process.uptime(),
      checks,
      timestamp: new Date().toISOString(),
      supportedLanguages: {
        isActive: supportedLanguages,
        default:
          i18n.lang ||
          this.configService.get('I18N_FALLBACK_LANGUAGE') ||
          DEFAULT_LANGUAGE,
        supported: supportedLanguages
          ? SUPPORTED_LANGUAGES
          : [
              i18n.lang ||
                this.configService.get('I18N_FALLBACK_LANGUAGE') ||
                DEFAULT_LANGUAGE,
            ],
      },
    };

    const meta = {
      language: 'typescript',
      framework: 'nestjs',
    };

    if (!isHealthy) {
      throw new ServiceUnavailableException(response);
    }

    return okResponse({ data: response, meta });
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }

  /*
  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      await this.redisService.ping();
      return 'up';
    } catch {
      return 'down';
    }
  }
  */
}
