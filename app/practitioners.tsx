import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  Icon,
  InfoCallout,
  PillButton,
  Rule,
  Segment,
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
} from '@/components/ui/fb';
import { useCaseIntelligenceHome, useFilingBuilder } from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

type AccessLevel = 'read_only' | 'commentable' | 'filing_review';

type PractitionerPlaceholder = {
  id: string;
  name: string;
  email: string;
  accessLevel: AccessLevel;
  status: 'draft_invite' | 'local_placeholder' | 'revoked_placeholder';
};

const ACCESS_LEVELS: Array<{ v: AccessLevel; label: string }> = [
  { v: 'read_only', label: 'Read-only' },
  { v: 'commentable', label: 'Comment-able' },
  { v: 'filing_review', label: 'Filing review' },
];

function accessLabel(value: AccessLevel) {
  if (value === 'commentable') return 'Comment-able';
  if (value === 'filing_review') return 'Filing review';
  return 'Read-only';
}

export default function Practitioners() {
  const { home } = useCaseIntelligenceHome();
  const { filingPackages, entries } = useFilingBuilder();
  const { isMobile } = useResponsive();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('read_only');
  const [practitioners, setPractitioners] = useState<PractitionerPlaceholder[]>([]);
  const auditRows = useMemo(
    () => [
      'Local practitioner sharing surface opened.',
      `${entries.length} entries are available for future scoped sharing.`,
      `${filingPackages.length} filing packages are available for future review sharing.`,
      'No invite email, permission grant, or remote access record has been created.',
    ],
    [entries.length, filingPackages.length],
  );

  function createPlaceholder() {
    const displayName = name.trim() || 'Practitioner placeholder';
    const displayEmail = email.trim() || 'not-sent@example.local';
    setPractitioners((current) => [
      {
        id: `local-practitioner-${Date.now()}`,
        name: displayName,
        email: displayEmail,
        accessLevel,
        status: 'local_placeholder',
      },
      ...current,
    ]);
    setName('');
    setEmail('');
    setAccessLevel('read_only');
  }

  function revokePlaceholder(id: string) {
    setPractitioners((current) =>
      current.map((practitioner) =>
        practitioner.id === id
          ? {
              ...practitioner,
              status: 'revoked_placeholder',
            }
          : practitioner,
      ),
    );
  }

  return (
    <CaseScreen desktopMaxWidth={1060}>
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone="amber" outline={false}>
            Placeholder
          </Chip>
          <Chip tone="mute" outline={false}>
            Local only
          </Chip>
        </View>
        <Display italic size={32} style={styles.title}>
          Practitioner sharing
        </Display>
        <Text style={styles.subtitle}>
          Local planning surface for future attorney, evaluator, or mediator sharing. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <InfoCallout title="No real sharing yet" tone="ink">
        This MVP does not send invite emails, grant remote permissions, expose data to practitioners, or write sharing records to a backend.
      </InfoCallout>

      <View style={!isMobile ? styles.desktopGrid : undefined}>
        <View style={!isMobile ? styles.leftColumn : undefined}>
          <SoftCard p={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="plus" size={16} color={fbColors.ink} />
                <Text style={styles.sectionTitle}>Invite placeholder</Text>
              </View>
              <Chip tone="amber" outline={false}>
                Not sent
              </Chip>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Practitioner name"
              placeholderTextColor={fbColors.inkFaint}
              style={styles.input}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email placeholder"
              placeholderTextColor={fbColors.inkFaint}
              autoCapitalize="none"
              style={styles.input}
            />
            <Segment<AccessLevel> items={ACCESS_LEVELS} value={accessLevel} onChange={setAccessLevel} />
            <PillButton tone="primary" size="md" icon="plus" full onPress={createPlaceholder}>
              Create local placeholder
            </PillButton>
          </SoftCard>

          <SoftCard p={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="folder" size={16} color={fbColors.ink} />
                <Text style={styles.sectionTitle}>Shared scope placeholders</Text>
              </View>
            </View>
            <Text style={styles.bodyText}>
              Future sharing can be scoped to selected entries, filing packages, reports, and private practitioner notes.
            </Text>
            <View style={styles.metricGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>ENTRIES</Text>
                <Text style={styles.metricValue}>{entries.length}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>FILINGS</Text>
                <Text style={styles.metricValue}>{filingPackages.length}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>CASE</Text>
                <Text style={styles.metricValue}>{home.activeCase?.title || 'Current case'}</Text>
              </View>
            </View>
          </SoftCard>
        </View>

        <View style={!isMobile ? styles.rightColumn : undefined}>
          <SoftCard p={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="chat" size={16} color={fbColors.ink} />
                <Text style={styles.sectionTitle}>Practitioner list</Text>
              </View>
              <Chip tone={practitioners.length ? 'ink' : 'mute'} outline={false}>
                {practitioners.length}
              </Chip>
            </View>
            {practitioners.length ? (
              <View style={styles.stack}>
                {practitioners.map((practitioner) => (
                  <View key={practitioner.id} style={styles.practitionerRow}>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{practitioner.name}</Text>
                      <Text style={styles.rowMeta}>
                        {practitioner.email} · {accessLabel(practitioner.accessLevel)} · {practitioner.status}
                      </Text>
                    </View>
                    <PillButton
                      tone="ghost"
                      size="sm"
                      icon="x"
                      disabled={practitioner.status === 'revoked_placeholder'}
                      onPress={() => revokePlaceholder(practitioner.id)}
                    >
                      Revoke
                    </PillButton>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.bodyText}>No practitioner placeholders have been created yet.</Text>
            )}
          </SoftCard>

          <SoftCard p={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="shield" size={16} color={fbColors.ink} />
                <Text style={styles.sectionTitle}>Access audit placeholder</Text>
              </View>
            </View>
            <View style={styles.stack}>
              {auditRows.map((row) => (
                <View key={row} style={styles.auditRow}>
                  <Icon name="dot" size={10} color={fbColors.ox} />
                  <Text style={styles.auditText}>{row}</Text>
                </View>
              ))}
            </View>
          </SoftCard>
        </View>
      </View>
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
  desktopGrid: {
    marginTop: fbSpacing.x4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x4,
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
  },
  rightColumn: {
    flex: 1,
    minWidth: 0,
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
  input: {
    minHeight: fbTouch.min,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    paddingHorizontal: fbSpacing.x3,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansRegular,
  },
  bodyText: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: fbSpacing.x2,
  },
  metricBox: {
    flex: 1,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    backgroundColor: fbColors.paperDeep,
  },
  metricLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  metricValue: {
    marginTop: fbSpacing.x1,
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  stack: {
    gap: fbSpacing.x2,
  },
  practitionerRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.surface,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  rowMeta: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x2,
  },
  auditText: {
    flex: 1,
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
});
