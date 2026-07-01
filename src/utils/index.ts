export function handleError(error: unknown, fallbackMessage: string): string {
  const message = error instanceof Error ? `${fallbackMessage}: ${error.message}` : fallbackMessage
  console.error(`[${new Date().toISOString()}] ${message}`, error)
  return fallbackMessage
}