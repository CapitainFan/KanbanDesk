/** Log error with context for debugging. Shows toast for user, logs for dev. */
export function handleError(error: unknown, fallbackMessage: string): string {
  const message = error instanceof Error ? `${fallbackMessage}: ${error.message}` : fallbackMessage
  console.error(`[${new Date().toISOString()}] ${message}`, error)
  return fallbackMessage
}