import { Repository } from 'typeorm';

export function getSafeSelect<T extends object>(
  repository: Repository<T>,
  select?: string[],
): Extract<keyof T, string>[] | undefined {
  if (!select?.length) return undefined;

  const fields = select.filter(
    (field): field is Extract<keyof T, string> =>
      field in repository.metadata.propertiesMap,
  );

  return fields.length ? fields : undefined;
}
