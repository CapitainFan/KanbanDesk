export function getItem<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    if (value === null) return fallback
    // Try to parse as JSON first, fall back to raw string
    try {
      return JSON.parse(value) as T
    } catch {
      return value as unknown as T
    }
  } catch {
    return fallback
  }
}

export function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    console.warn('Failed to write to localStorage:', e)
  }
}
