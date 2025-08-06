# General utility functions #CodeReuse
// apps/server/utils/helpers.ts

/**
 * Returns the value at the given path of an object, or a default value if undefined.
 * Simple dot notation supported (e.g., 'a.b.c').
 */
export function getOr<T = any>(
  obj: unknown,
  path: string,
  defaultValue: T
): T {
  if (!obj || typeof obj !== 'object') return defaultValue;
  const keys = path.split('.');
  let result: any = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }
  return result as T;
}

/**
 * Returns a deep clone of the given object.
 * Uses JSON serialization; only safe for JSON-compatible data.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Returns a Promise that resolves after the specified milliseconds.
 * Useful for delaying async flows (e.g., retries, backoff).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Trims all string values in an object recursively.
 * Leaves non-string values untouched.
 */
export function trimStringsInObject<T>(obj: T): T {
  if (typeof obj === 'string') return (obj.trim() as unknown) as T;
  if (Array.isArray(obj)) {
    return obj.map(trimStringsInObject) as unknown as T;
  }
  if (typeof obj === 'object' && obj !== null) {
    const trimmedObj: any = {};
    for (const [k, v] of Object.entries(obj)) {
      trimmedObj[k] = trimStringsInObject(v as any);
    }
    return trimmedObj;
  }
  return obj;
}

/**
 * Safe JSON parse helper returning null on failure instead of throwing.
 */
export function safeJsonParse<T = any>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * JSON stringify with stable ordering of keys.
 * Useful for consistent cache keys or comparisons.
 */
export function stableStringify(obj: any): string {
  const allKeys = new Set<string>();

  JSON.stringify(obj, (key, value) => {
    allKeys.add(key);
    return value;
  });

  return JSON.stringify(obj, Array.from(allKeys).sort());
}

/**
 * Checks if the current environment matches the given one (e.g. 'production').
 */
export function isEnv(env: string): boolean {
  return process.env.NODE_ENV === env;
}

/**
 * Capitalizes first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Checks if a value is null or undefined.
 */
export function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined;
}
