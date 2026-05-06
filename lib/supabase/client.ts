import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from './database.types';
import { getSupabaseEnvironmentStatus } from './environment';
import type { SupabaseEnvironmentStatus } from './environment';

export { getSupabaseEnvironmentStatus };
export type { SupabaseEnvironmentStatus };

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnvironmentStatus = getSupabaseEnvironmentStatus();
export const isSupabaseConfigured = supabaseEnvironmentStatus === 'configured';

// Guard for SSR/static rendering where localStorage doesn't exist
const isServer = typeof window === 'undefined';

// Secure storage adapter for auth tokens
const SecureStoreAdapter = {
  getItem: (key: string) => {
    if (isServer) return null;
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (isServer) return;
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (isServer) return;
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

function warnIfSupabaseDisabled() {
  if (!__DEV__ || isSupabaseConfigured) return;

  const reason =
    supabaseEnvironmentStatus === 'missing'
      ? 'missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY'
      : supabaseEnvironmentStatus === 'placeholder'
        ? 'placeholder Supabase environment values'
        : 'an invalid EXPO_PUBLIC_SUPABASE_URL';

  console.warn(
    `[Family Bench] Supabase is disabled because of ${reason}. ` +
      'The app is using local demo data and is not connected to a Supabase project.',
  );
}

warnIfSupabaseDisabled();

export const supabase = isSupabaseConfigured && supabaseUrl && supabaseAnonKey
  ? createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          storage: SecureStoreAdapter,
          autoRefreshToken: !isServer,
          persistSession: !isServer,
          detectSessionInUrl: false,
        },
      },
    )
  : null;
