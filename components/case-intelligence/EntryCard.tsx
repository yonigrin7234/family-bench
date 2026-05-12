import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Chip,
  EntryMark,
  Mono,
  Rule,
  SoftCard,
  fbAlpha,
  fbColors,
  fbFonts,
  fbSpacing,
  fbType,
  fbWeights,
  type ChipTone,
} from '@/components/ui/fb';
import {
  formatDateLabel,
  getEntryTypeOption,
  type Entry,
  isEntryReviewed,
} from '@/lib/case-intelligence';

export function EntryCard({
  entry,
  attachmentCount = 0,
  filingLinkCount = 0,
  compact = false,
  onPress,
}: {
  entry: Entry;
  attachmentCount?: number;
  filingLinkCount?: number;
  compact?: boolean;
  onPress?: () => void;
}) {
  const option = getEntryTypeOption(entry.entry_type);
  const hasPrivateNote = Boolean(entry.private_notes);
  const reviewed = isEntryReviewed(entry);

  const card = (
    <SoftCard p={compact ? 14 : 16} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.typeRow}>
          <EntryMark type={entry.entry_type} size={compact ? 28 : 32} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{entry.title || option.defaultTitle}</Text>
            <Mono dim size={10.5} style={styles.date}>
              {formatDateLabel(entry.event_date, entry.event_time)}
            </Mono>
          </View>
        </View>
        <View style={styles.chips}>
          {reviewed ? (
            <Chip tone="forest" outline={false}>
              Reviewed
            </Chip>
          ) : null}
          {entry.is_flagged ? (
            <Chip tone="ox" outline={false}>
              Flagged
            </Chip>
          ) : null}
          {attachmentCount > 0 ? (
            <Chip tone="amber" outline={false}>
              {attachmentCount === 1 ? '1 attachment' : `${attachmentCount} attachments`}
            </Chip>
          ) : null}
          {filingLinkCount > 0 ? (
            <Chip tone="forest" outline={false}>
              {filingLinkCount === 1 ? 'Linked to filing' : `${filingLinkCount} filings`}
            </Chip>
          ) : null}
          {!compact ? (
            <Chip tone={option.tone as ChipTone} outline={false}>
              {option.shortLabel}
            </Chip>
          ) : null}
        </View>
      </View>

      {entry.body ? (
        <Text numberOfLines={compact ? 2 : undefined} style={styles.body}>
          {entry.body}
        </Text>
      ) : null}

      {entry.location_name ? (
        <Mono dim size={10.5} style={styles.meta}>
          Location: {entry.location_name}
        </Mono>
      ) : null}

      {hasPrivateNote && !compact ? (
        <>
          <Rule style={styles.rule} />
          <Text style={styles.privateLabel}>PRIVATE NOTE</Text>
          <Text style={styles.privateNote}>{entry.private_notes}</Text>
        </>
      ) : null}
    </SoftCard>
  );

  if (!onPress) return card;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open entry: ${entry.title || option.defaultTitle}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: fbSpacing.x3,
  },
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  typeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x3,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.14,
  },
  date: {
    marginTop: fbSpacing.x1,
  },
  chips: {
    alignItems: 'flex-end',
    gap: fbSpacing.x1,
  },
  body: {
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  meta: {
    textTransform: 'uppercase',
  },
  rule: {
    marginTop: fbSpacing.x1,
  },
  privateLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  privateNote: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
});
