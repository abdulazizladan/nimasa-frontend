/** Helpers for talking to the NestJS backend. */

/**
 * The backend sometimes wraps a list as `{ data: [...] }`. Accepts either shape, so callers
 * never have to guess.
 */
export function unwrapList<T>(response: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(response)) return response;
  return response?.data ?? [];
}

/**
 * A readable message from an HTTP error. NestJS validation errors arrive as an array of
 * messages; those are joined. Anything else falls back to the given text.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string | string[] } })?.error?.message;
  if (Array.isArray(message)) return message.join('. ');
  return message || fallback;
}
