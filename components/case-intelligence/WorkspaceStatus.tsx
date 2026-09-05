import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { PillButton, fbBorder, fbColors, fbFonts, fbType } from '@/components/ui/fb';

export function WorkspaceStatus() {
  const state = useCaseIntelligenceStore();
  const [retryError, setRetryError] = useState<string | null>(null);
  if (!state.ownerId) return null;
  const pending = Object.values(state.localRecords).filter((r) => r.sync_status !== 'synced').length;
  const message = state.storageBlocked ? state.error
    : state.contextError ? state.contextError
      : state.persistence.error ? `Save needs attention: ${state.persistence.error}`
      : state.saving ? 'Saving on this device…'
        : state.loading ? 'Opening your case…'
          : state.syncing ? 'Syncing your saved changes…'
            : state.conflicts.length ? 'Changes from another device need review.'
              : state.syncError ? state.syncError
                : pending ? 'Saved on this device. Changes are waiting to sync.'
                  : state.hasLoaded && state.snapshot.cases.length ? 'Saved and synced' : 'Your private workspace';
  const attention = Boolean(state.storageBlocked || state.contextError || state.persistence.error || state.syncError || state.conflicts.length);
  async function retry() {
    setRetryError(null);
    try { await state.retrySave(); } catch (err) { setRetryError(err instanceof Error ? err.message : 'Unable to retry.'); }
  }
  return <View style={[styles.bar, attention && styles.attention]}>
    <View style={styles.copy}>
      <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>
      {retryError && <Text accessibilityRole="alert" style={styles.text}>{retryError}</Text>}
    </View>
    {state.conflicts.length || state.contextError ? <PillButton size="sm" tone="ghost" onPress={() => router.push('/settings')}>Review</PillButton>
      : attention ? <PillButton size="sm" tone="ghost" disabled={Boolean(state.saving || state.syncing)} onPress={retry}>Retry</PillButton> : null}
  </View>;
}
const styles = StyleSheet.create({
  bar: { minHeight: 40, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: fbColors.paper, borderBottomWidth: fbBorder.hairline, borderBottomColor: fbColors.rule, flexDirection: 'row', alignItems: 'center', gap: 12 },
  attention: { backgroundColor: fbColors.amberWash },
  copy: { flex: 1 }, text: { color: fbColors.inkSoft, fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21 },
});
