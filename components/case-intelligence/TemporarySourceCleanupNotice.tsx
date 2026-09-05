import { StyleSheet, Text, View } from 'react-native';
import { PillButton, fbColors, fbFonts, fbSpacing } from '@/components/ui/fb';
import { retryTemporarySourceCleanup, useTemporarySourceCleanup } from '@/lib/evidence/sourceCleanup';

/** Mount above auth/loading routing so an abandoned source remains visible after sign-out. */
export function TemporarySourceCleanupNotice() {
  const state = useTemporarySourceCleanup();
  if (!state.error && !state.pendingCount) return null;
  return <View style={styles.notice}>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.text}>{state.error || `${state.pendingCount} temporary app-cache ${state.pendingCount === 1 ? 'file awaits' : 'files await'} cleanup.`}</Text>
    <PillButton size="sm" disabled={state.working} onPress={() => { void retryTemporarySourceCleanup().catch(() => {}); }}>{state.working ? 'Cleaning temporary files…' : 'Retry temporary-file cleanup'}</PillButton>
  </View>;
}
const styles = StyleSheet.create({ notice: { padding: fbSpacing.x3, backgroundColor: fbColors.paperDeep, gap: fbSpacing.x2 }, text: { fontFamily: fbFonts.sansRegular, fontSize: 13, lineHeight: 19, color: fbColors.ink } });
