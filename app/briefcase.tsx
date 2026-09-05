import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { EvidenceChecks } from '@/components/briefcase/EvidenceChecks';
import { OrderOriginalPicker } from '@/components/briefcase/OrderOriginalPicker';
import { Chip, Display, Icon, InfoCallout, PillButton, SoftCard, fbAlpha, fbBorder, fbColors, fbFonts, fbRadii, fbSpacing, fbTouch, fbType } from '@/components/ui/fb';
import { getCourtOrderProvisionStatus, getEntryTypeOption, isEntryReviewed, useCaseIntelligenceHome } from '@/lib/case-intelligence';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { buildBriefcaseModel, searchBriefcaseEntries, searchBriefcaseOrders, selectedBriefcaseAttachments, selectedBriefcaseEntries } from '@/lib/briefcase/model';
import { localCalendarDate } from '@/lib/utils/dateInput';

function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function ids(value: string | undefined) {
  try { const parsed: unknown = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []; }
  catch { return []; }
}
function dateLabel(date: string | null, time?: string | null) { return date ? `${date}${time ? ` · ${time.slice(0, 5)}` : ''}` : 'Date not recorded'; }

export default function Briefcase() {
  const params = useLocalSearchParams<{ hearingId?: string; orderId?: string; entryIds?: string }>();
  const { snapshot, home } = useCaseIntelligenceHome();
  const ownerId = useCaseIntelligenceStore((state) => state.ownerId);
  const caseId = home.activeCase?.id || null;
  const model = useMemo(() => buildBriefcaseModel(snapshot, ownerId, caseId), [snapshot, ownerId, caseId]);
  const [query, setQuery] = useState('');
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => ids(one(params.entryIds)));
  const scope = `${ownerId}:${caseId}`;
  const previousScope = useRef<string | null>(ownerId && caseId ? scope : null);
  useEffect(() => {
    if (!ownerId || !caseId) return;
    if (previousScope.current === null) { previousScope.current = scope; return; }
    if (previousScope.current === scope) return;
    previousScope.current = scope;
    setQuery(''); setLinkedOnly(false); setSelectedIds([]);
    router.setParams({ hearingId: '', orderId: '', entryIds: '' });
  }, [scope, ownerId, caseId]);
  const hearingId = one(params.hearingId);
  const orderId = one(params.orderId);
  const today = localCalendarDate(new Date());
  const hearing = model.hearings.find((row) => row.id === hearingId)
    || (!hearingId ? model.hearings.find((row) => !row.is_completed && row.event_date >= today) : undefined);
  const order = model.orders.find((row) => row.id === orderId);
  const provisions = model.provisions.filter((row) => row.court_order_id === order?.id);
  const original = model.attachments.find((row) => row.id === order?.source_attachment_id);
  const matchingOrders = searchBriefcaseOrders(model, query);
  const matchingEntries = searchBriefcaseEntries(model, query, order?.id, linkedOnly);
  const selectedEntries = selectedBriefcaseEntries(model, selectedIds);
  const selectedAttachments = selectedBriefcaseAttachments(model, selectedIds);

  function chooseEntries(next: string[]) {
    const allowed = selectedBriefcaseEntries(model, next).map((entry) => entry.id);
    setSelectedIds(allowed); router.setParams({ entryIds: JSON.stringify(allowed) });
  }
  function toggleEntry(id: string) { chooseEntries(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]); }
  function openEntry(id: string) { router.push({ pathname: '/entry/[id]', params: { id } }); }

  return <CaseScreen desktopMaxWidth={1120} rightRail={false}>
    <View style={styles.page}>
      <View style={styles.header}>
        <Chip tone="ink">Hearing preparation</Chip>
        <Display size={34} accessibilityRole="header">Briefcase</Display>
        <Text style={styles.intro}>Keep the order, provisions, and source records you need within reach. Your selections are preparation choices; they do not assess compliance or legal relevance.</Text>
        <View style={styles.row}>
          <PillButton tone="ghost" onPress={() => router.push('/case-map')}>Manage orders and dates</PillButton>
          <PillButton tone="soft" onPress={() => router.push({ pathname: '/capture', params: { type: 'court_order' } })}>Capture an order original</PillButton>
          <PillButton tone="ghost" onPress={() => router.push('/trust-center' as never)}>Trust Center</PillButton>
        </View>
      </View>

      {!model.activeCase ? <SoftCard p={16} style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Start with your case</Text>
        <Text style={styles.body}>Add the case details, hearing dates, and orders you want to prepare.</Text>
        <PillButton tone="primary" onPress={() => router.push('/onboarding')}>Set up a case</PillButton>
      </SoftCard> : <>
        <SoftCard p={16} style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>{model.activeCase.title}</Text>
          <Text style={styles.body}>{[model.activeCase.court_name, model.activeCase.department && `Department ${model.activeCase.department}`, model.activeCase.case_number].filter(Boolean).join(' · ') || 'Court details are not recorded.'}</Text>
          <Text nativeID="briefcase-hearing-label" style={styles.label}>Hearing</Text>
          {model.hearings.length ? <View style={styles.row}>
            {model.hearings.map((row) => <PillButton key={row.id} tone={hearing?.id === row.id ? 'primary' : 'ghost'} accessibilityLabel={`${row.title}, ${dateLabel(row.event_date, row.event_time)}${hearing?.id === row.id ? ', selected' : ''}`} onPress={() => router.setParams({ hearingId: row.id })}>{row.title} · {dateLabel(row.event_date, row.event_time)}{row.is_completed ? ' · completed' : ''}</PillButton>)}
          </View> : <Text style={styles.body}>No hearing dates are recorded. Add one in Case Map to give this briefcase a hearing context.</Text>}
          {hearing && <Text style={styles.body}>Selected hearing: {hearing.title}, {dateLabel(hearing.event_date, hearing.event_time)}. Records are included only when you select them below.</Text>}
        </SoftCard>

        <SoftCard p={16} style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Find an order or record</Text>
          <Text nativeID="briefcase-search-label" style={styles.label}>Search this case</Text>
          <TextInput accessibilityLabel="Search orders and records" aria-labelledby="briefcase-search-label" value={query} onChangeText={setQuery} placeholder="Words, names, dates, or file names" placeholderTextColor={fbColors.inkMute} autoCorrect={false} style={styles.input} />
          <Text style={styles.body}>Search checks entry titles and factual text, original-file names, and order provisions. Private notes and private entries are not searched.</Text>
          {!!query && <PillButton tone="ghost" size="sm" onPress={() => setQuery('')}>Clear search</PillButton>}
        </SoftCard>

        <SoftCard p={16} style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Order at hand</Text>
          {matchingOrders.length ? <View style={styles.row}>{matchingOrders.map((row) => <PillButton key={row.id} tone={order?.id === row.id ? 'primary' : 'ghost'} accessibilityLabel={`${row.order_title}, ${dateLabel(row.order_date)}${order?.id === row.id ? ', selected' : ''}`} onPress={() => router.setParams({ orderId: row.id })}>{row.order_title} · {dateLabel(row.order_date)}</PillButton>)}</View>
            : <Text style={styles.body}>{model.orders.length ? 'No orders match this search.' : 'No orders are recorded. Add the order details and provisions in Case Map.'}</Text>}
          {order ? <View style={styles.orderDetail}>
            <Text accessibilityRole="header" style={styles.title}>{order.order_title}</Text>
            <Text style={styles.body}>{dateLabel(order.order_date)}{order.order_type ? ` · ${order.order_type}` : ''}</Text>
            {original?.entry_id ? <PillButton tone="soft" onPress={() => openEntry(original.entry_id!)}>Open original: {original.file_name}</PillButton> : <Text style={styles.body}>An original-file link is not recorded for this order. Capture the original, then link it below.</Text>}
            <OrderOriginalPicker key={`${scope}:${order.id}`} order={order} attachments={model.attachments} entries={model.entries} onSave={async (sourceAttachmentId) => {
              const state = useCaseIntelligenceStore.getState();
              const current = state.snapshot.courtOrders.find((row) => row.id === order.id && row.case_id === caseId && row.user_id === ownerId && !row.deleted_at);
              if (!current || state.ownerId !== ownerId) throw new Error('This order is no longer available in this case.');
              await state.updateCourtOrder(current.id, { title: current.order_title, orderType: current.order_type, orderDate: current.order_date, sourceAttachmentId });
            }} />
            {provisions.length ? provisions.map((provision) => <View key={provision.id} style={styles.provision}>
              <View style={styles.row}><Text style={styles.entryTitle}>{provision.label}</Text><Chip tone={getCourtOrderProvisionStatus(provision) === 'active' ? 'forest' : 'mute'}>{getCourtOrderProvisionStatus(provision) === 'active' ? 'Marked active' : 'Marked superseded'}</Chip></View>
              <Text selectable style={styles.factualText}>{provision.body}</Text>
              <Text style={styles.body}>{provision.category}{provision.effective_date ? ` · from ${provision.effective_date}` : ''}{provision.end_date ? ` · ends ${provision.end_date}` : ''}</Text>
            </View>) : <Text style={styles.body}>No provisions have been entered for this order. Review the original and add provisions in Case Map.</Text>}
            <PillButton tone="ghost" size="sm" onPress={() => { router.setParams({ orderId: '' }); setLinkedOnly(false); }}>Clear selected order</PillButton>
          </View> : <Text style={styles.body}>Select an order to keep its recorded provisions visible while you find related entries.</Text>}
        </SoftCard>

        <SoftCard p={16} style={styles.card}>
          <View style={styles.row}><Text accessibilityRole="header" style={styles.title}>Source records</Text><Chip tone="forest">{selectedEntries.length} selected</Chip></View>
          <View style={styles.row}>
            <PillButton tone={linkedOnly ? 'primary' : 'ghost'} disabled={!order} onPress={() => setLinkedOnly((value) => !value)} accessibilityLabel={`Only records linked to selected order, ${linkedOnly ? 'on' : 'off'}`}>{linkedOnly ? 'Showing order-linked records' : 'Only order-linked records'}</PillButton>
            <PillButton tone="ghost" disabled={!matchingEntries.length} onPress={() => chooseEntries([...selectedIds, ...matchingEntries.map((row) => row.id)])}>Select search results</PillButton>
            <PillButton tone="ghost" disabled={!selectedEntries.length} onPress={() => chooseEntries([])}>Clear selection</PillButton>
          </View>
          <Text style={styles.body}>{matchingEntries.length} records match. {model.privateEntryCount ? `${model.privateEntryCount} private entries are hidden. ` : ''}Selections remain included when you change the search. Review the selected list before exporting.</Text>
          {matchingEntries.map((entry) => <View key={entry.id} style={styles.record}>
            <Pressable accessibilityRole="checkbox" accessibilityLabel={`Include ${entry.title || 'Untitled entry'}`} aria-checked={selectedIds.includes(entry.id)} onPress={() => toggleEntry(entry.id)} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
              <View style={[styles.checkbox, selectedIds.includes(entry.id) && styles.checked]}>{selectedIds.includes(entry.id) && <Icon name="check" size={14} color={fbColors.paper} />}</View>
              <View style={styles.recordCopy}><Text style={styles.entryTitle}>{entry.title || getEntryTypeOption(entry.entry_type).defaultTitle}</Text><Text style={styles.body}>{dateLabel(entry.event_date, entry.event_time)} · {getEntryTypeOption(entry.entry_type).shortLabel}</Text></View>
            </Pressable>
            <Text numberOfLines={3} style={styles.body}>{entry.body || 'No factual text is recorded.'}</Text>
            <View style={styles.row}><Chip tone={isEntryReviewed(entry) ? 'forest' : 'amber'}>{isEntryReviewed(entry) ? 'Marked reviewed' : 'Review needed'}</Chip><Text style={styles.body}>{model.attachments.filter((row) => row.entry_id === entry.id).length} original files</Text><PillButton tone="ghost" size="sm" onPress={() => openEntry(entry.id)}>Open record</PillButton></View>
          </View>)}
          {!matchingEntries.length && <Text style={styles.body}>No shareable records match. Clear the search or add an entry.</Text>}
        </SoftCard>

        <SoftCard p={16} style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Your selected briefcase</Text>
          {selectedEntries.length ? selectedEntries.map((entry) => <View key={entry.id} style={styles.selectionRow}><Text style={[styles.body, styles.recordCopy]}>{dateLabel(entry.event_date)} · {entry.title || 'Untitled entry'}</Text><PillButton size="sm" tone="ghost" accessibilityLabel={`Remove ${entry.title || 'entry'} from briefcase`} onPress={() => toggleEntry(entry.id)}>Remove</PillButton></View>) : <Text style={styles.body}>Choose records above. Nothing is included automatically because of a hearing or order selection.</Text>}
          <PillButton tone="primary" disabled={!selectedEntries.length} onPress={() => router.push({ pathname: '/export-prep', params: { entryIds: JSON.stringify(selectedEntries.map((entry) => entry.id)) } })}>Review selected PDF or evidence ZIP</PillButton>
          <Text style={styles.body}>The export contains selected factual entries and their original-file references. Order provisions are not added automatically. Include the order’s source entry if you want its attached original in the ZIP.</Text>
        </SoftCard>
        <EvidenceChecks key={scope} ownerId={ownerId} caseId={caseId} attachments={selectedAttachments} title="Check the selected files before your hearing" />
        <InfoCallout title="Before you rely on this at court" tone="ink">Download and open the PDF or ZIP you plan to bring. This file check does not establish that the app shell or sign-in can reopen without a connection. Hearing dates and provision text are the details you entered; verify them against your court notices and original orders.</InfoCallout>
      </>}
    </View>
  </CaseScreen>;
}

const styles = StyleSheet.create({
  page: { gap: fbSpacing.x5 }, header: { gap: fbSpacing.x3 }, card: { gap: fbSpacing.x3 },
  intro: { fontFamily: fbFonts.sansRegular, fontSize: 16, lineHeight: 24, color: fbColors.inkMute },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: fbSpacing.x2 },
  title: { fontFamily: fbFonts.sansSemi, fontSize: fbType.h2, color: fbColors.ink },
  entryTitle: { fontFamily: fbFonts.sansSemi, fontSize: fbType.body, lineHeight: 21, color: fbColors.ink },
  label: { fontFamily: fbFonts.sansMedium, fontSize: fbType.body, color: fbColors.ink },
  body: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.inkMute },
  factualText: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 22, color: fbColors.ink },
  input: { minHeight: fbTouch.min, padding: fbSpacing.x3, borderWidth: fbBorder.hairline, borderColor: fbColors.rule, borderRadius: fbRadii.md, color: fbColors.ink, fontFamily: fbFonts.sansRegular, fontSize: fbType.body, backgroundColor: fbColors.paper },
  orderDetail: { gap: fbSpacing.x3, marginTop: fbSpacing.x2, paddingTop: fbSpacing.x3, borderTopWidth: fbBorder.hairline, borderTopColor: fbColors.rule },
  provision: { gap: fbSpacing.x2, padding: fbSpacing.x3, backgroundColor: fbColors.paper, borderRadius: fbRadii.md },
  record: { gap: fbSpacing.x2, paddingVertical: fbSpacing.x3, borderTopWidth: fbBorder.hairline, borderTopColor: fbColors.rule },
  choice: { flexDirection: 'row', alignItems: 'center', gap: fbSpacing.x3, minHeight: fbTouch.min },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: fbColors.inkMute, borderRadius: fbRadii.sm, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: fbColors.ink, borderColor: fbColors.ink }, recordCopy: { flex: 1, minWidth: 0 },
  selectionRow: { flexDirection: 'row', alignItems: 'center', gap: fbSpacing.x2 }, pressed: { opacity: fbAlpha.pressed },
});
