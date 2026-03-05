import { Injectable, Logger } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError } from 'src/common/exceptions';
import { ResponseFactory } from 'src/common/exceptions/response.factory';
import {
  Repository,
  FindOptionsWhere,
  ILike,
  FindOptionsRelations,
  FindOptionsOrder,
} from 'typeorm';

/**
 * Estructura de filtros dinámicos.
 * Permite paths como:
 *
 * {
 *   nombre: "juan",
 *   "rol.nombre": "admin"
 * }
 */
interface DynamicQueryFilters {
  [key: string]: any;
}

/**
 * Servicio encargado de construir consultas dinámicas seguras para TypeORM.
 *
 * Características:
 *
 * - Filtrado dinámico
 * - Paginación
 * - Ordenamiento
 * - Carga automática de relaciones
 * - Protección contra Prototype Pollution
 *
 * Seguridad implementada:
 *
 * - Objetos creados con `Object.create(null)`
 * - Sanitización de claves peligrosas
 * - Validación del path completo
 */
@Injectable()
export class DynamicQueryService {
  private readonly logger = new Logger(DynamicQueryService.name);

  /**
   * Claves peligrosas que podrían permitir Prototype Pollution
   */
  private readonly forbiddenKeys = new Set([
    '__proto__',
    'constructor',
    'prototype',
  ]);

  /**
   * Valida que el path no contenga claves peligrosas.
   */
  private isPathSafe(path: string[]): boolean {
    return !path.some((segment) => this.forbiddenKeys.has(segment));
  }

  /**
   * Construye un objeto `where` anidado para TypeORM.
   *
   * Ejemplo:
   *
   * path = ["rol", "nombre"]
   *
   * Resultado:
   *
   * {
   *   rol: {
   *     nombre: ILike("%admin%")
   *   }
   * }
   */
  private buildNestedWhere(path: string[], value: any, target: any): void {
    const [current, ...rest] = path;

    if (!rest.length) {
      if (current === 'id') {
        target[current] = Number(value);
      } else {
        target[current] = ILike(`%${value}%`);
      }
      return;
    }

    if (!target[current]) {
      target[current] = Object.create(null);
    }

    this.buildNestedWhere(rest, value, target[current]);
  }

  /**
   * Construye estructura `order` anidada para TypeORM.
   *
   * Ejemplo:
   *
   * sort="rol.nombre DESC"
   *
   * Resultado:
   *
   * {
   *   rol: {
   *     nombre: "DESC"
   *   }
   * }
   */
  private buildNestedOrder(
    path: string[],
    direction: string,
    target: any,
  ): void {
    const [current, ...rest] = path;

    const upperDirection = direction.toUpperCase();
    const validDirection =
      upperDirection === 'ASC' || upperDirection === 'DESC'
        ? upperDirection
        : 'ASC';

    if (!rest.length) {
      target[current] = validDirection;
      return;
    }

    if (!target[current]) {
      target[current] = Object.create(null);
    }

    this.buildNestedOrder(rest, validDirection, target[current]);
  }

  /**
   * Valida que un valor sea entero y mayor o igual a un mínimo.
   */
  private validateInteger(
    value: number,
    min: number,
    errorKey: string,
    i18n: I18nContext,
  ) {
    if (!Number.isInteger(value) || value < min) {
      ResponseFactory.error({
        i18n,
        lang: i18n.lang,
        code: 'BAD_REQUEST',
      });
    }
  }

  /**
   * Extrae relaciones de los paths usados en filtros, ordenamiento o select.
   *
   * Ejemplo:
   *
   * ["rol.nombre", "empresa.nombre"] → ["rol","empresa"]
   */
  private extractRelationsFromPaths(
    paths: string[],
    validRelations: Set<string>,
  ): Set<string> {
    const relations = new Set<string>();

    for (const path of paths) {
      const root = path.split('.')[0];
      if (validRelations.has(root)) {
        relations.add(root);
      }
    }

    return relations;
  }

  /**
   * Método principal que ejecuta consultas dinámicas.
   *
   * Soporta:
   *
   * - filtros dinámicos
   * - ordenamiento
   * - paginación
   * - selección parcial
   * - relaciones automáticas
   */
  async findAndCount<T extends object>(
    repository: Repository<T>,
    filters: DynamicQueryFilters,
    page: number,
    limit: number,
    i18n: I18nContext,
    sort?: string,
    select?: (keyof T)[],
  ): Promise<{ data: T[]; total: number }> {
    page = Number(page);
    limit = Number(limit);

    this.validateInteger(page, 1, 'pagination.pageInvalid', i18n);
    this.validateInteger(limit, 10, 'pagination.limitInvalid', i18n);

    try {
      const metadata = repository.metadata;

      const validColumns = new Set(
        metadata.columns.map((col) => col.propertyName),
      );

      const validRelations = new Set(
        metadata.relations.map((rel) => rel.propertyName),
      );

      /**
       * Construcción de WHERE
       */
      const where: FindOptionsWhere<T>[] = [];

      for (const key in filters) {
        if (!filters[key]) continue;

        const path = key.split('.');

        // Seguridad contra prototype pollution
        if (!this.isPathSafe(path)) continue;

        const root = path[0];

        if (validColumns.has(root) || validRelations.has(root)) {
          const condition: FindOptionsWhere<T> = Object.create(null);

          this.buildNestedWhere(path, filters[key], condition);

          if (Object.keys(condition).length > 0) {
            where.push(condition);
          }
        }
      }

      /**
       * Construcción de ORDER
       */
      const order: FindOptionsOrder<T> = Object.create(null);

      if (sort) {
        const sortSplit = sort.split(',');

        for (const or of sortSplit) {
          const [field, direction] = or.trim().split(/\s+/);

          if (!field || !direction) continue;

          const path = field.split('.');

          if (!this.isPathSafe(path)) continue;

          const root = path[0];

          if (validColumns.has(root) || validRelations.has(root)) {
            this.buildNestedOrder(path, direction, order);
          }
        }
      }

      /**
       * Determinar relaciones necesarias
       */
      let relations: FindOptionsRelations<T> | undefined;

      if (select && select.length > 0) {
        const relationSet = new Set<string>();

        this.extractRelationsFromPaths(
          select as string[],
          validRelations,
        ).forEach((r) => relationSet.add(r));

        this.extractRelationsFromPaths(
          Object.keys(filters),
          validRelations,
        ).forEach((r) => relationSet.add(r));

        if (sort) {
          const sortFields = sort
            .split(',')
            .map((s) => s.trim().split(/\s+/)[0]);

          this.extractRelationsFromPaths(sortFields, validRelations).forEach(
            (r) => relationSet.add(r),
          );
        }

        relations =
          relationSet.size > 0
            ? (Object.fromEntries(
                Array.from(relationSet).map((r) => [r, true]),
              ) as FindOptionsRelations<T>)
            : undefined;
      } else {
        relations = Object.fromEntries(
          Array.from(validRelations).map((r) => [r, true]),
        ) as FindOptionsRelations<T>;
      }

      /**
       * Ejecución de consulta
       */
      const [data, total] = await repository.findAndCount({
        where: where.length > 0 ? where : undefined,
        order,
        relations,
        skip: Math.max(0, (page - 1) * limit),
        take: Math.max(1, limit),
        select: select && select.length > 0 ? select : undefined,
      });

      return { data, total };
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
