import { Injectable, Logger } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { badRequestError, internalServerError } from 'src/common/exceptions';
import {
  Repository,
  FindOptionsWhere,
  ILike,
  FindOptionsRelations,
  FindOptionsOrder,
} from 'typeorm';

/**
 * @interface DynamicQueryFilters
 * Define la estructura de los filtros de la consulta dinámica.
 * Las claves son la ruta del campo (ej: 'nombre', 'relation.field') y el valor es el término de búsqueda.
 */
interface DynamicQueryFilters {
  [key: string]: any;
}

/**
 * @class DynamicQueryService
 * Servicio encargado de realizar consultas dinámicas (filtrado, paginación y ordenamiento)
 * a través de un repositorio de TypeORM.
 */
@Injectable()
export class DynamicQueryService {
  private readonly logger = new Logger(DynamicQueryService.name);
  /**
   * Genera la estructura de condiciones 'where' anidadas para TypeORM,
   * aplicando el operador 'ILike' para búsquedas parciales no sensibles a mayúsculas.
   *
   * @private
   * @param path Array de strings que representan la ruta anidada del campo (ej: ['relation', 'field']).
   * @param value El valor a buscar.
   * @param target El objeto 'where' al que se le añade la condición.
   */
  private buildNestedWhere(path: string[], value: any, target: any): void {
    const [current, ...rest] = path;

    if (!rest.length) {
      // Caso base: aplicar ILike al campo final
      if (current === 'id') {
        target[current] = Number(value);
      } else {
        target[current] = ILike(`%${value}%`);
      }
    } else {
      // Caso recursivo: asegurar que la relación exista y continuar anidando
      if (!target[current]) {
        target[current] = {};
      }
      this.buildNestedWhere(rest, value, target[current]);
    }
  }

  /**
   * Genera la estructura de ordenamiento 'order' anidada para TypeORM.
   *
   * @private
   * @param path Array de strings que representan la ruta anidada del campo.
   * @param direction Dirección del ordenamiento ('ASC' o 'DESC').
   * @param target El objeto 'order' al que se le añade la dirección.
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
        : 'ASC'; // Valor por defecto

    if (!rest.length) {
      // Caso base: aplicar la dirección al campo final
      target[current] = validDirection;
    } else {
      // Caso recursivo: asegurar que la relación exista y continuar anidando
      if (!target[current]) {
        target[current] = {};
      }
      this.buildNestedOrder(rest, validDirection, target[current]);
    }
  }

  /**
   * Valida que un valor sea un número entero y cumpla un mínimo requerido.
   *
   * @param {number} value - El valor a validar.
   * @param {number} min - El valor mínimo permitido (inclusive).
   * @param {string} errorKey - Clave del archivo de traducciones para el mensaje de error.
   * @param {object} i18n - Instancia del manejador de internacionalización.
   *
   * @throws Lanzará un badRequestError si el valor no es válido.
   *
   * @example
   * validateInteger(page, 1, 'pagination.pageInvalid', i18n, badRequestError);
   * validateInteger(limit, 10, 'pagination.limitInvalid', i18n, badRequestError);
   */
  private validateInteger(
    value: number,
    min: number,
    errorKey: string,
    i18n: I18nContext,
  ) {
    if (!Number.isInteger(value) || value < min) {
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t(errorKey, { lang: i18n.lang }),
      });
    }
  }

  /**
   * Extrae relaciones desde paths (solo primer nivel)
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
   * Realiza una consulta dinámica con paginación, filtros de búsqueda parcial (ILike)
   * y ordenamiento, incluyendo automáticamente las relaciones detectadas.
   *
   * @param repository El repositorio de TypeORM de la entidad.
   * @param filters Los filtros a aplicar (ej: { 'nombre': 'valor', 'relation.campo': 'valor2' }).
   * @param page El número de página (debe ser >= 1).
   * @param limit El número máximo de resultados por página.
   * @param sort Opcional. Cadena con la configuración de ordenamiento (ej: 'campo1 DESC, relation.campo2 ASC').
   * @returns Una promesa con los datos paginados y el total de resultados.
   */
  async findAndCount<T extends object>(
    repository: Repository<T>,
    filters: DynamicQueryFilters,
    page: number,
    limit: number,
    i18n: I18nContext,
    sort?: string,
    select?: (keyof T)[],
  ): Promise<{ data: T[]; total: number } | any> {
    page = Number(page); //|| 1;
    limit = Number(limit); //|| 10;

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

      // 1. Construcción de 'where'
      // Usamos FindOptionsWhere<T>[] para manejar condiciones OR (ej: buscar en varios campos distintos)
      const where: FindOptionsWhere<T>[] = [];

      for (const key in filters) {
        if (!filters[key]) continue;

        const path = key.split('.');
        const root = path[0];

        // Se valida que el campo/relación raíz exista en la entidad
        if (validColumns.has(root) || validRelations.has(root)) {
          const condition: FindOptionsWhere<T> = {};
          this.buildNestedWhere(path, filters[key], condition);

          // Si la condición se construyó correctamente, se añade
          if (Object.keys(condition).length > 0) {
            // IMPORTANTE: TypeORM usa un array de FindOptionsWhere para unirlas con OR
            // Si quieres unir todas con AND (más común para filtros), se debe hacer:
            // where.push(condition); y luego usar un solo objeto where
            // Sin embargo, para mantener el mismo comportamiento (múltiples condiciones de búsqueda)
            // en el 'where' principal, se construye como un solo objeto si solo hay una condición
            // o como un array para el caso de OR si hubieran múltiples raíces de filtros
            where.push(condition);
          }
        }
      }

      // Se usa un solo objeto 'where' si solo se tiene una condición, para evitar un WHERE (c1 OR c2)
      // que podría ser innecesario si la intención es AND. Dado que el original usa un array
      // para cada filtro, lo mantendremos así por coherencia

      // 2. Construcción de 'order'
      const order: FindOptionsOrder<T> = {};
      if (sort) {
        const sortSplit = sort.split(',');
        for (const or of sortSplit) {
          const [field, direction] = or.trim().split(/\s+/); // Manejar múltiples espacios
          if (!field || !direction) continue;

          const path = field.split('.');
          const root = path[0];

          // Se valida que el campo/relación raíz exista en la entidad
          if (validColumns.has(root) || validRelations.has(root)) {
            this.buildNestedOrder(path, direction, order);
          }
        }
      }

      // 3. Preparación de relaciones
      // Solo cargamos las relaciones si se especifican en los filtros o el ordenamiento,
      // o cargamos *todas* las relaciones para la respuesta.
      // OPTIMIZACIÓN: El código original cargaba *todas* las relaciones. Esto puede ser ineficiente.
      // Para mantener la funcionalidad original (de que todas las relaciones se carguen),
      // mantendremos 'relations: Object.fromEntries(Array.from(validRelations).map(rel => [rel, true]))'
      // como en tu código, pero se recomienda pasar un objeto `relations` explícito desde el controlador.

      // Convertir el Set de relaciones a un objeto de FindOptionsRelations<T>
      let relations: FindOptionsRelations<T> | undefined;

      if (select && select.length > 0) {
        const relationSet = new Set<string>();

        // Desde select
        this.extractRelationsFromPaths(
          select as string[],
          validRelations,
        ).forEach((r) => relationSet.add(r));

        // Desde filtros
        this.extractRelationsFromPaths(
          Object.keys(filters),
          validRelations,
        ).forEach((r) => relationSet.add(r));

        // Desde order
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
        // Sin select → cargar todas las relaciones
        relations = Object.fromEntries(
          Array.from(validRelations).map((r) => [r, true]),
        ) as FindOptionsRelations<T>;
      }

      // const relations: FindOptionsRelations<T> = Object.fromEntries(
      //   Array.from(validRelations).map((rel) => [rel, true]),
      // ) as FindOptionsRelations<T>;

      // 4. Ejecución de la consulta
      const [data, total] = await repository.findAndCount({
        // TypeORM acepta FindOptionsWhere<T>[] para aplicar condiciones OR.
        where: where.length > 0 ? where : undefined,
        order,
        relations, // Se cargan todas las relaciones
        skip: Math.max(0, (page - 1) * limit), // Asegura skip >= 0
        take: Math.max(1, limit), // Asegura take >= 1,
        select: select && select.length > 0 ? select : undefined, // Se pasa el select si se especifica
      });

      return { data, total };
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
