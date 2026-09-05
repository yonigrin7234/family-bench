import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PillButton, fbColors, fbFonts, fbSpacing, fbType } from '@/components/ui/fb';
import type { CourtOrder, Entry, EvidenceAttachment } from '@/lib/case-intelligence/types';
import { getEntryMetadata } from '@/lib/case-intelligence/review';
import { publicFileName } from '@/lib/export/model';

export function OrderOriginalPicker({ order, attachments, entries, onSave }: {
  order: CourtOrder;
  attachments: EvidenceAttachment[];
  entries: Entry[];
  onSave: (attachmentId: string | null) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(order.source_attachment_id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const current = useRef(true);
  const busy = useRef(false);
  useEffect(() => { current.current = true; return () => { current.current = false; }; }, []);
  useEffect(() => { setSelectedId(order.source_attachment_id); }, [order.source_attachment_id]);

  async function save() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true); setError(null); setNotice(null);
    try {
      await onSave(selectedId);
      if (current.current) { setNotice(selectedId ? 'Original link saved on this device.' : 'Original link removed. The file and source entry are unchanged.'); setExpanded(false); }
    } catch (failure) {
      if (current.current) setError(failure instanceof Error ? failure.message : 'The original link could not be saved. Try again.');
    } finally {
      busy.current = false;
      if (current.current) setSaving(false);
    }
  }

  return <View style={styles.section}>
    <PillButton size="sm" tone="ghost" disabled={saving} onPress={() => setExpanded((value) => !value)}>{expanded ? 'Close original-file choices' : order.source_attachment_id ? 'Change original-file link' : 'Link an original file'}</PillButton>
    {expanded && <>
      <Text accessibilityRole="header" style={styles.label}>Original for {order.order_title}</Text>
      <Text style={styles.body}>Choose the exact file you reviewed. Linking a file does not extract or change provision text, and does not add it to your export selection.</Text>
      <View style={styles.choices}>
        <PillButton tone={!selectedId ? 'primary' : 'ghost'} disabled={saving} accessibilityLabel={`No original linked${!selectedId ? ', selected' : ''}`} onPress={() => setSelectedId(null)}>No original linked</PillButton>
        {attachments.map((attachment) => {
          const entry = entries.find((row) => row.id === attachment.entry_id);
          const label = `${publicFileName(attachment.file_name)}${entry ? ` · ${entry.event_date}` : ''}${entry && getEntryMetadata(entry).review_visibility === 'private' ? ' · private entry' : ''}`;
          return <PillButton key={attachment.id} tone={selectedId === attachment.id ? 'primary' : 'ghost'} disabled={saving} accessibilityLabel={`${label}${selectedId === attachment.id ? ', selected' : ''}`} onPress={() => setSelectedId(attachment.id)}>{label}</PillButton>;
        })}
      </View>
      {!attachments.length && <Text style={styles.body}>No original files are attached to this case. Use “Capture an order original” above, then return here to link it.</Text>}
      <PillButton tone="primary" disabled={saving || Boolean(selectedId && !attachments.some((row) => row.id === selectedId))} onPress={() => void save()}>{saving ? 'Saving original link…' : 'Save original link'}</PillButton>
    </>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {notice && <Text accessibilityLiveRegion="polite" style={styles.body}>{notice}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: fbSpacing.x2 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: fbSpacing.x2 },
  label: { fontFamily: fbFonts.sansMedium, fontSize: fbType.body, color: fbColors.ink },
  body: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.inkMute },
  error: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.oxDeep },
});
