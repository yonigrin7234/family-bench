import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  Icon,
  InfoCallout,
  PillButton,
  Rule,
  SoftCard,
  fbBorder,
  fbColors,
  fbFonts,
  fbLegalCopy,
  fbRadii,
  fbSpacing,
  fbTouch,
  fbType,
  fbWeights,
  type IconName,
} from '@/components/ui/fb';

const RESOURCE_PLACEHOLDERS: Array<{ title: string; body: string; icon: IconName }> = [
  {
    title: 'Emergency resources placeholder',
    body: 'Future versions can show jurisdiction-aware hotlines, shelters, legal aid, and court resources. This MVP does not call or message anyone.',
    icon: 'phone',
  },
  {
    title: 'Evidence preservation mode',
    body: 'Future preservation mode can strengthen hashing, backups, and timestamp review. Current evidence remains local metadata and source entries only.',
    icon: 'shield',
  },
  {
    title: 'Confidential address reminder',
    body: 'Before sharing or exporting, review whether addresses or contact details should remain private. No automatic redaction is performed yet.',
    icon: 'home',
  },
];

const COMING_LATER = [
  'Panic mode',
  'Stealth or disguised app presentation',
  'Emergency contact notification',
  'Location-aware resource directory',
  'Automated evidence backup',
];

export default function SafetyPlaceholder() {
  return (
    <CaseScreen desktopMaxWidth={980}>
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone="amber" outline={false}>
            Placeholder
          </Chip>
          <Chip tone="mute" outline={false}>
            No automation
          </Chip>
        </View>
        <Display italic size={32} style={styles.title}>
          Safety
        </Display>
        <Text style={styles.subtitle}>
          Calm safety planning placeholders for future protected workflows. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <InfoCallout title="Safety limits" tone="ink">
        This page does not contact emergency services, notify anyone, hide the app, erase data, or create remote backups. Use local emergency services or qualified support when immediate safety is at issue.
      </InfoCallout>

      <View style={styles.grid}>
        {RESOURCE_PLACEHOLDERS.map((resource) => (
          <SoftCard key={resource.title} p={16} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Icon name={resource.icon} size={17} color={fbColors.ink} />
              </View>
              <Text style={styles.cardTitle}>{resource.title}</Text>
            </View>
            <Text style={styles.cardBody}>{resource.body}</Text>
          </SoftCard>
        ))}
      </View>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="paperclip" size={16} color={fbColors.ink} />
            <Text style={styles.sectionTitle}>Evidence preservation explanation</Text>
          </View>
        </View>
        <Text style={styles.bodyText}>
          Family Bench separates source evidence from reviewed notes and future interpretations. Current local records preserve source text, attachment metadata, local references, timestamps, and sync status fields where available.
        </Text>
        <Text style={styles.bodyText}>
          Future preservation features should keep original files intact, record hashes, and maintain a clear chain between source entries, attachments, reports, and filing packages.
        </Text>
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="clock" size={16} color={fbColors.ink} />
            <Text style={styles.sectionTitle}>Coming later</Text>
          </View>
        </View>
        <View style={styles.stack}>
          {COMING_LATER.map((item) => (
            <View key={item} style={styles.row}>
              <Icon name="dot" size={10} color={fbColors.ox} />
              <Text style={styles.rowText}>{item}</Text>
            </View>
          ))}
        </View>
        <Rule />
        <PillButton tone="ghost" size="md" icon="phone" disabled full>
          Emergency calling automation not enabled
        </PillButton>
      </SoftCard>
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: fbSpacing.x3,
  },
  kickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  title: {
    lineHeight: 34,
  },
  subtitle: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  grid: {
    marginTop: fbSpacing.x4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x4,
  },
  card: {
    flex: 1,
    minWidth: 240,
    gap: fbSpacing.x3,
  },
  cardHeader: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: fbRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.paperDeep,
  },
  cardTitle: {
    flex: 1,
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  cardBody: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  section: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
  },
  sectionHeader: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  sectionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  sectionTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  bodyText: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  stack: {
    gap: fbSpacing.x2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x2,
    paddingVertical: fbSpacing.x1,
  },
  rowText: {
    flex: 1,
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
});
