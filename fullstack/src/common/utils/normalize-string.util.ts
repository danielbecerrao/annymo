export const normalizeString = (
  value: unknown,
  toLowerCase: boolean = false,
): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized: string = value.trim();
  return toLowerCase ? normalized.toLowerCase() : normalized;
};
