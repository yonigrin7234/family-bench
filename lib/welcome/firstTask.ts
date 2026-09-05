export type WelcomeTask = 'case' | 'capture' | 'briefcase';
export function firstTaskDestination(task: WelcomeTask, hasCase: boolean) {
  if (task === 'case') return hasCase ? { pathname: '/cases' as const } : { pathname: '/onboarding' as const };
  if (!hasCase) return { pathname: '/onboarding' as const, params: { next: task } };
  return task === 'capture' ? { pathname: '/capture' as const } : { pathname: '/briefcase' as const };
}
