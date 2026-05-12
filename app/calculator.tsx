// Custody calculator — §14 from the feature list.
// Mobile-primary surface. Pulls custody_period from logged entries and
// shows breakdown over a selectable date range. "Scheduled vs actual"
// comparison waits for a custody-schedule data model.

import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  InfoCallout,
  Mono,
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
  fbType,
  fbWeights,
  type ChipTone,
} from '@/components/ui/fb';
import {
  getEntryTypeOption,
  useCaseIntelligenceTimeline,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

type PeriodKey = '30d' | '90d' | 'ytd';

const PERIODS: { v: PeriodKey; label: string; days?: number }[] = [
  { v: '30d', label: 'Last 30 days', days: 30 },
  { v: '90d', label: 'Last 90 days', days: 90 },
  { v: 'ytd', label: 'Year to date' },
];

type Bucket = 'my_time' | 'their_time' | 'transition' | 'neutral' | 'unrecorded';

const BUCKETS: Bucket[] = ['my_time', 'their_time', 'transition', 'neutral', 'unrecorded'];

const BUCKET_META: Record<Bucket, { label: string; color: string }> = {
  my_time:    { label: 'Your time',     color: fbColors.ink },
  their_time: { label: 'Their time',    color: fbColors.ox },
  transition: { label: 'Transition',    color: fbColors.amber },
  neutral:    { label: 'Neutral',       color: fbColors.forest },
  unrecorded: { label: 'Not recorded',  color: 'rgba(20,24,31,0.30)' },
};

function bucketOf(period?: string | null): Bucket {
  if (!period) return 'unrecorded';
  const k = period.toLowerCase();
  if (k === 'my_time' || k === 'mine') return 'my_time';
  if (k === 'their_time' || k === 'theirs') return 'their_time';
  if (k === 'transition' || k === 'exchange') return 'transition';
  if (k === 'neutral' || k === 'third_party' || k === 'supervised') return 'neutral';
  return 'unrecorded';
}

function startOfPeriod(p: PeriodKey): Date {
  const now = new Date();
  if (p === 'ytd') return new Date(now.getFullYear(), 0, 1);
  const days = p === '30d' ? 30 : 90;
  return new Date(now.getTime() - days * 86400000);
}

export default function Calculator() {
  const { entries, activeCase } = useCaseIntelligenceTimeline();
  const { isMobile } = useResponsive();
  const [period, setPeriod] = useState<PeriodKey>('90d');

  const stats = useMemo(() => {
    const cutoff = startOfPeriod(period).getTime();
    const filtered = entries.filter((e) => {
      const t = new Date(e.event_date).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    });
    const counts: Record<Bucket, number> = {
      my_time: 0,
      their_time: 0,
      transition: 0,
      neutral: 0,
      unrecorded: 0,
    };
    for (const e of filtered) counts[bucketOf(e.custody_period)] += 1;
    return { entries: filtered, counts, total: filtered.length };
  }, [entries, period]);

  const pct = (b: Bucket) =>
    stats.total ? Math.round((stats.counts[b] / stats.total) * 100) : 0;

  const transitionEntries = stats.entries
    .filter((e) => bucketOf(e.custody_period) === 'transition')
    .slice(0, 8);

  const periodLabel = PERIODS.find((p) => p.v === period)?.label ?? '';

  return (
    <CaseScreen desktopMaxWidth={920}>
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <Display size={isMobile ? 28 : 36} style={styles.title}>
          Custody calculator
        </Display>
        <Text style={styles.subtitle}>
          {activeCase?.title || 'Current case'} · {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <SoftCard p={12} style={styles.segmentCard}>
        <Segment<PeriodKey>
          value={period}
          onChange={setPeriod}
          items={PERIODS.map((p) => ({ v: p.v, label: p.label }))}
        />
      </SoftCard>

      <SoftCard p={0} style={styles.section}>
        <View style={styles.bigCount}>
          <Text style={styles.bigNumber}>{pct('my_time')}%</Text>
          <View style={styles.bigCopy}>
            <Text style={styles.bigLabel}>Your time</Text>
            <Text style={styles.bigSub}>
              {stats.counts.my_time} of {stats.total || 0} logged{' '}
              {stats.total === 1 ? 'entry' : 'entries'} · {periodLabel.toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={styles.barWrap}>
          {BUCKETS.map((b) => {
            const count = stats.counts[b];
            if (!count) return null;
            return (
              <View
                key={b}
                style={{
                  flex: count,
                  height: 18,
                  backgroundColor: BUCKET_META[b].color,
                }}
              />
            );
          })}
          {!stats.total ? <View style={styles.barEmpty} /> : null}
        </View>

        <View style={styles.legend}>
          {BUCKETS.map((b) => (
            <View key={b} style={styles.legendRow}>
              <View
                style={[styles.legendDot, { backgroundColor: BUCKET_META[b].color }]}
              />
              <Text style={styles.legendLabel}>{BUCKET_META[b].label}</Text>
              <Mono size={11} dim style={styles.legendCount}>
                {stats.counts[b]} · {pct(b)}%
              </Mono>
            </View>
          ))}
        </View>
      </SoftCard>

      <InfoCallout title="Scheduled vs actual" tone="ink">
        Comparing your logged entries to the court-ordered custody schedule
        will land once the custody-schedule data model ships. For now this
        view shows the breakdown of what you have already captured.
      </InfoCallout>

      <SoftCard p={0} style={styles.section}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>
            Transitions in {periodLabel.toLowerCase()}
          </Text>
          <Chip tone="mute" outline={false}>
            {transitionEntries.length}
          </Chip>
        </View>
        {transitionEntries.length === 0 ? (
          <View style={styles.tableEmpty}>
            <Text style={styles.tableEmptyText}>
              No exchanges or transitions captured in this range.
            </Text>
          </View>
        ) : (
          transitionEntries.map((entry, i) => {
            const opt = getEntryTypeOption(entry.entry_type);
            return (
              <View key={entry.id} style={[styles.tableRow, i > 0 && styles.tableRowBorder]}>
                <Mono size={10} dim style={styles.tableDate}>
                  {entry.event_date}
                </Mono>
                <Text style={styles.tableTitle} numberOfLines={1}>
                  {entry.title || opt.defaultTitle}
                </Text>
                <Chip tone={opt.tone as ChipTone} outline={false}>
                  {opt.shortLabel}
                </Chip>
              </View>
            );
          })
        )}
      </SoftCard>

      <Rule style={styles.actionsRule} />
      <View style={styles.actions}>
        <PillButton
          tone="primary"
          size="md"
          icon="doc"
          onPress={() => router.push('/reports' as never)}
        >
          Open Reports
        </PillButton>
        <PillButton
          tone="ghost"
          size="md"
          icon="folder"
          onPress={() => router.push('/filings' as never)}
        >
          Add to filing
        </PillButton>
      </View>
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: fbSpacing.x3,
  },
  title: {
    marginTop: fbSpacing.x2,
    lineHeight: 34,
  },
  subtitle: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  segmentCard: {
    marginTop: fbSpacing.x4,
  },
  section: {
    marginTop: fbSpacing.x4,
  },
  bigCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x4,
    paddingVertical: fbSpacing.x5,
    paddingHorizontal: fbSpacing.x5,
  },
  bigNumber: {
    color: fbColors.ink,
    fontSize: 56,
    lineHeight: 56,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -2.2,
  },
  bigCopy: {
    flex: 1,
    minWidth: 0,
  },
  bigLabel: {
    color: fbColors.ink,
    fontSize: 16,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.3,
  },
  bigSub: {
    marginTop: 3,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  barWrap: {
    flexDirection: 'row',
    height: 18,
    backgroundColor: fbColors.paperDeep,
    overflow: 'hidden',
    borderTopWidth: fbBorder.hairline,
    borderTopColor: fbColors.ruleSoft,
  },
  barEmpty: {
    flex: 1,
    height: 18,
    backgroundColor: fbColors.paperDeep,
  },
  legend: {
    paddingVertical: fbSpacing.x4,
    paddingHorizontal: fbSpacing.x5,
    gap: fbSpacing.x2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
  },
  legendCount: {
    flexShrink: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x4,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.ruleSoft,
  },
  tableHeaderText: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x4,
  },
  tableRowBorder: {
    borderTopWidth: fbBorder.hairline,
    borderTopColor: fbColors.ruleSoft,
  },
  tableDate: {
    width: 88,
  },
  tableTitle: {
    flex: 1,
    color: fbColors.ink,
    fontSize: 13.5,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
  },
  tableEmpty: {
    paddingVertical: fbSpacing.x4,
    paddingHorizontal: fbSpacing.x4,
  },
  tableEmptyText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  actionsRule: {
    marginTop: fbSpacing.x5,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
    marginTop: fbSpacing.x4,
  },
});
