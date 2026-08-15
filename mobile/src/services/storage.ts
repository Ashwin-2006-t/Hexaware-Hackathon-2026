// Simple persistent key-value store wrapper for Mobile / Web Demo
const memoryStore: Record<string, string> = {}

export const StorageService = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key)
      }
      return memoryStore[key] || null
    } catch {
      return memoryStore[key] || null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value)
      }
      memoryStore[key] = value
    } catch {
      memoryStore[key] = value
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      }
      delete memoryStore[key]
    } catch {
      delete memoryStore[key]
    }
  }
}
