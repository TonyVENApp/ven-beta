import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://zcnxzluhaqzlpxeobqjj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8v_YWAQWc4lMYmUW-_FyXg_v08BkxwL';

// iOS SecureStore has a 2048-byte limit per entry.
// Supabase JWTs exceed this, so we chunk large values across multiple keys.
const CHUNK_SIZE = 1800;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!chunkCount) {
      // Not chunked — read directly
      return SecureStore.getItemAsync(key);
    }
    const chunks: string[] = [];
    for (let i = 0; i < parseInt(chunkCount, 10); i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
      if (chunk === null) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const total = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_chunks`, String(total));
    for (let i = 0; i < total; i++) {
      await SecureStore.setItemAsync(
        `${key}_chunk_${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      );
    }
  },

  async removeItem(key: string): Promise<void> {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunkCount) {
      await SecureStore.deleteItemAsync(`${key}_chunks`);
      for (let i = 0; i < parseInt(chunkCount, 10); i++) {
        await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
