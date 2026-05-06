export type SupabaseEnvironmentStatus =
  | 'configured'
  | 'missing'
  | 'placeholder'
  | 'invalid';

type SupabaseEnvironment = Record<string, string | undefined>;

const PLACEHOLDER_VALUES = [
  '<project-ref>',
  '<anon-or-publishable-client-key>',
  '<powersync-endpoint-if-used>',
  'your-project-ref',
  'your-anon-key',
  'your-supabase-url',
  'placeholder',
];

function hasPlaceholderValue(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return PLACEHOLDER_VALUES.some((placeholder) => normalized.includes(placeholder));
}

function isValidUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getSupabaseEnvironmentStatus(
  env: SupabaseEnvironment = process.env,
): SupabaseEnvironmentStatus {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return 'missing';
  }

  if (hasPlaceholderValue(supabaseUrl) || hasPlaceholderValue(supabaseAnonKey)) {
    return 'placeholder';
  }

  if (!isValidUrl(supabaseUrl)) {
    return 'invalid';
  }

  return 'configured';
}
