export const memoryStorage: Record<string, string> = {};

export const storage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  },
  clear(): void {
    try {
      window.localStorage.clear();
    } catch (e) {
      for (const key in memoryStorage) {
        delete memoryStorage[key];
      }
    }
  }
};

export const memorySessionStorage: Record<string, string> = {};

export const session = {
  getItem(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return memorySessionStorage[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      memorySessionStorage[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      delete memorySessionStorage[key];
    }
  },
  clear(): void {
    try {
      window.sessionStorage.clear();
    } catch (e) {
      for (const key in memorySessionStorage) {
        delete memorySessionStorage[key];
      }
    }
  }
};
