export const getCurrentMonthPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const isValidMonthPeriod = (value: string) => /^\d{4}-\d{2}$/.test(value);

export const normalizeMonthPeriod = (value: unknown) =>
  typeof value === 'string' && isValidMonthPeriod(value) ? value : getCurrentMonthPeriod();

export const normalizeTextQuery = (value: unknown, maxLength = 120) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export const createEnumSearchNormalizer =
  <TValue extends string>(allowedValues: readonly TValue[], fallbackValue: TValue) =>
  (value: unknown): TValue =>
    typeof value === 'string' && allowedValues.includes(value as TValue)
      ? (value as TValue)
      : fallbackValue;
