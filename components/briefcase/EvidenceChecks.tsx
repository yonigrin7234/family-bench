import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Chip, PillButton, SoftCard, fbBorder, fbColors, fbFonts, fbSpacing, fbType } from '@/components/ui/fb';
import type { EvidenceAttachment } from '@/lib/case-intelligence/types';
import { useEvidenceChecks } from '@/lib/briefcase/useEvidenceChecks';

export function EvidenceChecks({ ownerId, caseId, attachments, title = 'Check your originals' }: {
  ownerId: string | null; caseId: string | null; attachments: EvidenceAttachment[]; title?: string;
}) {
  const { checking, progress, report, error, check } = useEvidenceChecks(ownerId, caseId, attachments);
  const verified = report?.results.filter((row) => row.status === 'verified').length || 0;
  const failed = report?.results.filter((row) => row.status === 'failed').length || 0;
  return <SoftCard p={16} style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.body}>Read and verify the SHA-256 and size of {attachments.length} original {attachments.length === 1 ? 'file' : 'files'}. If a file is only in cloud storage, this check downloads and saves a verified encrypted copy on this device.</Text>
    <PillButton tone="primary" disabled={checking || !attachments.length} onPress={() => void check()}>{checking ? `Checking ${progress} of ${attachments.length}…` : report ? 'Check files again' : 'Check files on this device'}</PillButton>
    {!attachments.length && <Text style={styles.body}>No original files are included in this selection.</Text>}
    {checking && <Text accessibilityLiveRegion="polite" style={styles.body}>{progress} of {attachments.length} files checked. Keep this screen open.</Text>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {report && <>
      <Text accessibilityLiveRegion="polite" style={styles.body}>{verified} verified · {failed} need attention. Checked {new Date(report.checkedAt).toLocaleString()}.</Text>
      {report.results.map((result) => <View key={result.attachmentId} style={styles.result}>
        <View style={styles.row}><Text style={styles.fileName}>{result.fileName}</Text><Chip tone={result.status === 'verified' ? 'forest' : 'ox'}>{result.status === 'verified' ? 'Verified now' : 'Needs attention'}</Chip></View>
        <Text style={result.status === 'failed' ? styles.error : styles.body}>{result.message}</Text>
        {result.entryId && <PillButton size="sm" tone="ghost" onPress={() => router.push({ pathname: '/entry/[id]', params: { id: result.entryId! } })}>Open source entry</PillButton>}
      </View>)}
    </>}
    <Text style={styles.body}>A check describes these files at this moment. Device storage can be cleared or become unavailable. It does not verify the events in a file, court acceptance, or that the app and sign-in will work without a connection. Keep a downloaded copy of the records you need.</Text>
  </SoftCard>;
}
const styles = StyleSheet.create({
  card: { gap: fbSpacing.x3 }, title: { fontFamily: fbFonts.sansSemi, fontSize: fbType.h2, color: fbColors.ink },
  body: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.inkMute },
  error: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.oxDeep },
  result: { gap: fbSpacing.x2, paddingTop: fbSpacing.x3, borderTopWidth: fbBorder.hairline, borderTopColor: fbColors.rule },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: fbSpacing.x2 },
  fileName: { flex: 1, minWidth: 120, fontFamily: fbFonts.sansMedium, fontSize: fbType.body, color: fbColors.ink },
});
