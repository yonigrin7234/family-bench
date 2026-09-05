import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { Chip, Display, PillButton, SoftCard, fbColors, fbFonts } from '@/components/ui/fb';
import { useCaseIntelligenceHome } from '@/lib/case-intelligence';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';

export default function Cases() {
  const { snapshot, home, loading } = useCaseIntelligenceHome();
  const switchCase = useCaseIntelligenceStore((state) => state.switchCase);
  const busy = useCaseIntelligenceStore((state) => Boolean(state.saving || state.syncing || state.switchingCase || !state.hasLoaded));
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cases = snapshot.cases.filter((row) => !row.deleted_at);
  async function openCase(id: string) {
    setError(null); setOpeningId(id);
    try { await switchCase(id); router.replace('/' as never); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to open this case. Try again.'); }
    finally { setOpeningId(null); }
  }
  return <CaseScreen rightRail={false}>
    <View style={styles.header}>
      <Display size={34}>Your cases</Display>
      <Text style={styles.body}>Choose the case you are working on. Each case keeps its own timeline, children, orders and saved working context.</Text>
      <PillButton tone="primary" disabled={busy || Boolean(openingId)} onPress={() => router.push('/onboarding?mode=create' as never)}>Create a case</PillButton>
    </View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {!cases.length ? <SoftCard p={20}><Text style={styles.body}>{loading ? 'Opening your account workspace…' : 'Add your first case to start recording events and preserving originals.'}</Text></SoftCard> : null}
    {cases.map((row) => {
      const selected = row.id === home.activeCase?.id;
      const children = snapshot.children.filter((child) => child.case_id === row.id && !child.deleted_at);
      const entryCount = snapshot.entries.filter((entry) => entry.case_id === row.id && !entry.deleted_at).length;
      return <SoftCard key={row.id} p={20} style={styles.card}>
        <View style={styles.titleRow}><Text accessibilityRole="header" style={styles.title}>{row.title || 'Untitled case'}</Text>{selected ? <Chip tone="forest">Selected</Chip> : null}</View>
        <Text style={styles.body}>{[row.court_name, row.county, row.case_number].filter(Boolean).join(' · ') || 'Court details can be added in setup.'}</Text>
        <Text style={styles.body}>{children.map((child) => child.name).join(', ') || 'No children recorded'} · {entryCount} {entryCount === 1 ? 'entry' : 'entries'}</Text>
        <View style={styles.actions}>
          <PillButton disabled={busy || Boolean(openingId)} tone={selected ? 'ghost' : 'primary'} onPress={() => openCase(row.id)}>{openingId === row.id ? 'Opening…' : selected ? 'Open case' : 'Switch to case'}</PillButton>
          {selected ? <PillButton disabled={busy || Boolean(openingId)} tone="ghost" onPress={() => router.push('/onboarding?mode=edit' as never)}>Edit setup</PillButton> : null}
        </View>
      </SoftCard>;
    })}
  </CaseScreen>;
}
const styles = StyleSheet.create({
  header: { gap: 14, marginBottom: 20 }, body: { fontFamily: fbFonts.sansRegular, color: fbColors.inkMute, fontSize: 14, lineHeight: 21 },
  title: { flex: 1, fontFamily: fbFonts.sansSemi, color: fbColors.ink, fontSize: 19 }, titleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  card: { gap: 12, marginBottom: 14 }, actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }, error: { color: fbColors.urgentRed, marginBottom: 12, fontFamily: fbFonts.sansRegular },
});
