export * from './dns';
export * from './domains';

import { z } from 'zod';

/**
 * Validate raw API response against a Zod schema.
 * Throws ValidationError with helpful message on failure.
 */
export function validateResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Validation failed:\n${issues}`);
  }
  return result.data;
}
