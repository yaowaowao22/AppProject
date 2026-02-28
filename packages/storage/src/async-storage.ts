import AsyncStorage from "@react-native-async-storage/async-storage";

export class KVStore {
  private readonly keyPrefix: string;

  constructor(prefix: string) {
    this.keyPrefix = `@${prefix}_`;
  }

  private prefixedKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(this.prefixedKey(key));
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(this.prefixedKey(key), serialized);
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(this.prefixedKey(key));
  }

  async has(key: string): Promise<boolean> {
    const value = await AsyncStorage.getItem(this.prefixedKey(key));
    return value !== null;
  }

  async clear(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefixedKeys = allKeys.filter((k) => k.startsWith(this.keyPrefix));
    if (prefixedKeys.length > 0) {
      await AsyncStorage.multiRemove(prefixedKeys);
    }
  }
}
