export function getItem<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value !== null ? (value as unknown as T) : fallback
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