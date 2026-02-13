import { DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const createDataSourceOptions = (
  configService: ConfigService,
): DataSourceOptions => {
  return {
    type: configService.get<any>('DB_TYPE'),
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    synchronize: false,
    ssl:
      configService.get<string>('DB_SSL') === 'true'
        ? { rejectUnauthorized: false }
        : false,
  };
};
