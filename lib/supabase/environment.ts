export type SupabaseEnvironmentStatus = 'configured' | 'missing' | 'placeholder' | 'invalid' | 'wrong_project';
type SupabaseEnvironment = Record<string, string | undefined>;
export const FAMILY_BENCH_PROJECT_REF = 'aeeovmnhfxobeqpczjvt';
const PLACEHOLDERS = ['<project-ref>', '<anon-or-publishable-client-key>', '<powersync-endpoint-if-used>', 'your-project-ref', 'your-anon-key', 'your-supabase-url', 'placeholder'];

function legacyClaims(key: string): { role?: string; ref?: string } | null {
  try {
    const parts = key.split('.');
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const value: unknown = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch { return null; }
}

export function getSupabaseEnvironmentStatus(
  // Expo substitutes direct property accesses at build time.
  env: SupabaseEnvironment = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SUPABASE_PROJECT_REF: process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF,
    EXPO_PUBLIC_SUPABASE_ALLOW_LOCAL: process.env.EXPO_PUBLIC_SUPABASE_ALLOW_LOCAL,
  },
): SupabaseEnvironmentStatus {
  const rawUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !key) return 'missing';
  if ([rawUrl, key].some((value) => PLACEHOLDERS.some((marker) => value.toLowerCase().includes(marker)))) return 'placeholder';
  let url: URL;
  try { url = new URL(rawUrl); } catch { return 'invalid'; }
  if (url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== '/')) return 'invalid';
  if (!['http:', 'https:'].includes(url.protocol)) return 'invalid';
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (isLocal) {
    if (env.EXPO_PUBLIC_SUPABASE_ALLOW_LOCAL !== 'true') return 'wrong_project';
  } else if (url.protocol !== 'https:' || url.hostname !== `${FAMILY_BENCH_PROJECT_REF}.supabase.co` || url.port
    || (env.EXPO_PUBLIC_SUPABASE_PROJECT_REF && env.EXPO_PUBLIC_SUPABASE_PROJECT_REF !== FAMILY_BENCH_PROJECT_REF)) {
    return 'wrong_project';
  }
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return 'configured';
  const claims = legacyClaims(key);
  // Legacy service_role JWTs are just as privileged as sb_secret_ keys.
  if (!claims || claims.role !== 'anon') return 'invalid';
  if (!isLocal && claims.ref !== FAMILY_BENCH_PROJECT_REF) return 'wrong_project';
  return 'configured';
}
