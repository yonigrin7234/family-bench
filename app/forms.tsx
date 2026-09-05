import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { Display, InfoCallout, PillButton, ProgressBar, SoftCard, fbBorder, fbColors, fbFonts, fbRadii, fbSpacing, fbTouch } from '@/components/ui/fb';
import { useCaseIntelligenceHome, useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getWorkspaceGeneration, useAuthStore } from '@/lib/auth/session';
import { getActiveCase } from '@/lib/case-intelligence/selectors';
import type { Entry, FamilyBenchCase } from '@/lib/case-intelligence/types';
import { courtFormSections, validateCourtFormValues, type CourtFormDraft, type CourtFormId, type CourtFormValues, type FormField } from '@/lib/forms/model';
import { courtFormTemplate } from '@/lib/forms/templates';
import { assertCourtFormSources, courtFormSources, courtFormSourceText } from '@/lib/forms/sources';
import { pinCourtFormPreparation } from '@/lib/forms/preparation';

export default function Forms() {
  const { home, hasHydrated, loading } = useCaseIntelligenceHome();
  if (!home.activeCase) return <CaseScreen>
    <Display accessibilityRole="header">Court forms</Display>
    <InfoCallout title="Case record" tone="ink">{loading || !hasHydrated ? 'Opening your case…' : 'Set up your case before preparing court forms.'}</InfoCallout>
    {hasHydrated && !loading ? <PillButton onPress={() => router.push('/onboarding' as never)}>Set up case</PillButton> : null}
  </CaseScreen>;
  return <FormsWorkspace key={`${home.activeCase.user_id}:${home.activeCase.id}`} activeCase={home.activeCase} />;
}

function Check({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onChange} style={[styles.check, checked && styles.checked]}>
    <Text style={styles.checkMark}>{checked ? '✓' : '○'}</Text><Text style={styles.checkText}>{label}</Text>
  </Pressable>;
}

function FormInput({ field, value, onChange, disabled }: { field: FormField; value: string | boolean | undefined; onChange: (value: string | boolean) => void; disabled: boolean }) {
  const id = `court-form-${field.id}`;
  if (field.kind === 'check') return <Check label={field.label} checked={value === true} disabled={disabled} onChange={() => onChange(value !== true)} />;
  return <View style={styles.field}>
    <Text nativeID={`${id}-label`} style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
    {field.help ? <Text style={styles.meta}>{field.help}</Text> : null}
    <TextInput nativeID={id} accessibilityLabel={`${field.label}${field.required ? ', required' : ''}`} accessibilityLabelledBy={`${id}-label`} accessibilityHint={field.date ? 'Use YYYY-MM-DD format.' : undefined}
      editable={!disabled} value={typeof value === 'string' ? value : ''} onChangeText={onChange} multiline={field.multiline}
      autoCapitalize={field.date || field.id === 'email' ? 'none' : 'sentences'} autoCorrect={!field.date && field.id !== 'email'}
      placeholder={field.date ? 'YYYY-MM-DD' : undefined} placeholderTextColor={fbColors.inkMute}
      keyboardType={field.id === 'email' ? 'email-address' : field.id === 'phone' ? 'phone-pad' : 'default'}
      style={[styles.input, field.multiline && styles.multiline]} />
  </View>;
}

function FormsWorkspace({ activeCase }: { activeCase: FamilyBenchCase }) {
  const drafts = useCaseIntelligenceStore((state) => state.courtFormDrafts);
  const snapshot = useCaseIntelligenceStore((state) => state.snapshot);
  const saveDraft = useCaseIntelligenceStore((state) => state.saveCourtFormDraft);
  const [editor, setEditor] = useState<{ id: string; formId: CourtFormId; values: CourtFormValues; sourceEntryIds: string[] } | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [notice, setNotice] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const sources = useMemo(() => courtFormSources(snapshot.entries, activeCase.id, activeCase.user_id), [snapshot.entries, activeCase.id, activeCase.user_id]);
  const ownedDrafts = drafts.filter((draft) => draft.caseId === activeCase.id && draft.userId === activeCase.user_id);
  const sections = editor ? courtFormSections(editor.formId) : [];
  const section = sections[sectionIndex];
  const isReview = Boolean(editor) && sectionIndex === sections.length;
  const template = editor ? courtFormTemplate(editor.formId) : null;

  function pinContext() {
    const generation = getWorkspaceGeneration(); const sessionGeneration = useAuthStore.getState().sessionGeneration;
    return () => {
      const state = useCaseIntelligenceStore.getState(); const auth = useAuthStore.getState();
      if (!mounted.current || generation !== getWorkspaceGeneration() || sessionGeneration !== auth.sessionGeneration
        || state.ownerId !== activeCase.user_id || auth.session?.user.id !== activeCase.user_id || auth.recovery
        || getActiveCase(state.snapshot)?.id !== activeCase.id) throw new Error('The account or active case changed. Reopen this draft before continuing.');
    };
  }

  function start(formId: CourtFormId, draft?: CourtFormDraft) {
    if (busyRef.current) return;
    const values = draft?.values ?? { caseNumber: activeCase.case_number ?? '', ...(formId === 'fl300' ? { county: activeCase.county ?? '' } : {}) };
    setEditor({ id: draft?.id ?? Crypto.randomUUID(), formId, values: { ...values }, sourceEntryIds: [...(draft?.sourceEntryIds ?? [])] });
    setSectionIndex(0); setReviewed(false); setNotice(null); setShowSources(false);
  }

  function change(fieldId: string, value: string | boolean) {
    if (busyRef.current) return;
    setEditor((current) => {
      if (!current) return current;
      const values = { ...current.values, [fieldId]: value };
      if (current.formId === 'mc031' && fieldId.startsWith('role') && value === true) {
        for (const role of ['rolePetitioner', 'roleRespondent', 'rolePlaintiff', 'roleDefendant', 'roleOther']) values[role] = role === fieldId;
        if (fieldId !== 'roleOther') values.otherRole = '';
      }
      return { ...current, values };
    });
    setReviewed(false); setNotice(null);
  }

  function insertSource(entry: Entry) {
    if (!editor || busyRef.current) return;
    try {
      assertCourtFormSources([entry.id], snapshot.entries, activeCase.id, activeCase.user_id);
      const fieldId = editor.formId === 'mc031' ? 'declaration' : 'supportingFacts';
      const existing = typeof editor.values[fieldId] === 'string' ? editor.values[fieldId] as string : '';
      const next = `${existing}${existing ? '\n\n' : ''}${courtFormSourceText(entry)}`;
      if (next.length > 20_000) throw new Error('This insertion would exceed the draft field limit. Edit the existing text first; no text was removed.');
      setEditor({ ...editor, values: { ...editor.values, [fieldId]: next }, sourceEntryIds: [...new Set([...editor.sourceEntryIds, entry.id])] });
      setReviewed(false); setNotice('Source text inserted. Edit it and review it as your own draft before generating the form.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'The source could not be inserted.'); }
  }

  async function save(close = false) {
    if (!editor || busyRef.current) return;
    busyRef.current = true; setBusy(true); setNotice(null);
    try {
      const assertCurrent = pinContext(); assertCurrent();
      await saveDraft({ ...editor, caseId: activeCase.id });
      assertCurrent();
      setNotice('Draft saved. Its account sync status appears above.');
      if (close) { setEditor(null); setReviewed(false); }
    } catch (error) { if (mounted.current) setNotice(error instanceof Error ? error.message : 'The draft could not be saved. Your edits are still here.'); }
    finally { busyRef.current = false; if (mounted.current) setBusy(false); }
  }

  async function generate() {
    if (!editor || busyRef.current) return;
    busyRef.current = true; setBusy(true); setNotice(null);
    try {
      const assertContext = pinContext(); assertContext();
      if (!reviewed) throw new Error('Review the inputs and confirm the review before preparing the PDF.');
      const values = validateCourtFormValues(editor.formId, editor.values);
      const assertPreparedContent = pinCourtFormPreparation({ ...editor, values, caseId: activeCase.id, userId: activeCase.user_id }, useCaseIntelligenceStore.getState().snapshot.entries);
      await saveDraft({ ...editor, values, caseId: activeCase.id });
      assertContext();
      const assertCurrent = () => {
        assertContext(); const state = useCaseIntelligenceStore.getState();
        assertPreparedContent(state.courtFormDrafts, state.snapshot.entries);
      };
      assertCurrent();
      const [{ createCourtFormPdf }, { loadCourtFormTemplate }, { downloadArtifact, sha256Bytes, loadTimelineFonts }] = await Promise.all([
        import('@/lib/forms/pdf'), import('@/lib/forms/assets'), import('@/lib/export/download'),
      ]);
      assertCurrent(); const [templateBytes, fonts] = await Promise.all([loadCourtFormTemplate(editor.formId), loadTimelineFonts()]); assertCurrent();
      const artifact = await createCourtFormPdf({ formId: editor.formId, values, reviewed, templateBytes }, { sha256: sha256Bytes, fontBytes: fonts.regular, assertCurrent });
      assertCurrent(); await downloadArtifact(artifact, assertCurrent);
      assertCurrent();
      setNotice('Editable, unsigned PDF prepared. Open and review every page, including repeated case captions. Attach required supporting papers and follow the court’s signing and filing instructions. Nothing has been filed or served.');
    } catch (error) { if (mounted.current) setNotice(error instanceof Error ? error.message : 'The PDF could not be prepared. The draft remains available.'); }
    finally { busyRef.current = false; if (mounted.current) setBusy(false); }
  }

  async function openSource(url: string) {
    try { await Linking.openURL(url); } catch { setNotice('The official source could not be opened. Please try again.'); }
  }

  return <CaseScreen contentStyle={styles.content} rightRail={false}>
    <Text style={styles.eyebrow}>CASE PAPERS</Text>
    <Display accessibilityRole="header" size={34}>Your facts. Your review.</Display>
    <Text style={styles.body}>Prepare editable California court forms from official templates. You choose the requests and write or review every factual statement.</Text>
    {notice ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    {!editor ? <>
      <InfoCallout title="Initial form workflow" tone="ink">This guide supports MC-031 and selected FL-300 fields. It does not decide which requests to make, supply legal advice, submit papers, or confirm court acceptance. Review the official instructions and the complete PDF before use.</InfoCallout>
      {(['mc031', 'fl300'] as const).map((id) => {
        const item = courtFormTemplate(id);
        return <SoftCard key={id} title={`${item.id} · ${item.title}`} subtitle={`California Judicial Council · revision ${item.revision}`}>
          <Text style={styles.body}>{id === 'mc031' ? 'Your factual declaration, attached to another form or court paper. Generated with a blank signature line.' : 'Guided custody, parenting-time and other-order requests on the full four-page form. Support, property, fees, emergency requests and additional attachments require further work outside this guide.'}</Text>
          <View style={styles.actions}><PillButton tone="primary" onPress={() => start(id)}>Start {item.id}</PillButton><PillButton onPress={() => openSource(item.informationUrl)}>Official form information</PillButton></View>
        </SoftCard>;
      })}
      <Display accessibilityRole="header" size={23}>Saved drafts</Display>
      {!ownedDrafts.length ? <Text style={styles.meta}>Saved drafts for this case will appear here.</Text> : ownedDrafts.map((draft) => <SoftCard key={draft.id} title={`${courtFormTemplate(draft.formId).id} · ${String(draft.values.caseNumber || 'Case draft')}`} subtitle={`Updated ${new Date(draft.updatedAt).toLocaleString()} · ${draft.sourceEntryIds.length} source entries`}>
        <PillButton onPress={() => start(draft.formId, draft)}>Open draft</PillButton>
      </SoftCard>)}
    </> : <>
      <SoftCard title={`${template!.id} · ${template!.title}`} subtitle={`Official revision ${template!.revision} · ${template!.pages} ${template!.pages === 1 ? 'page' : 'pages'}`}>
        <Text style={styles.meta}>Draft inputs are saved when you choose Save draft, Save and close, or prepare the PDF. Generation preserves editable fields and leaves all signatures blank.</Text>
        <Text style={styles.meta}>Use your PDF viewer’s save and print controls. The template’s embedded Save, Print and Clear buttons are inactive in this copy; they do not erase your saved files.</Text>
        <View style={styles.actions}><PillButton disabled={busy} onPress={() => save()}>Save draft</PillButton><PillButton disabled={busy} onPress={() => save(true)}>Save and close</PillButton><PillButton onPress={() => openSource(template!.sourceUrl)}>Official blank PDF</PillButton></View>
      </SoftCard>
      <ProgressBar pct={Math.round(((sectionIndex + 1) / (sections.length + 1)) * 100)} label={`Section ${sectionIndex + 1} of ${sections.length + 1}`} />
      <View style={styles.actions}>{sections.map((item, index) => <PillButton key={item.id} size="sm" tone={index === sectionIndex ? 'soft' : 'ghost'} disabled={busy} onPress={() => { setSectionIndex(index); setShowSources(false); }}>{index + 1}. {item.title}</PillButton>)}<PillButton size="sm" tone={isReview ? 'soft' : 'ghost'} disabled={busy} onPress={() => { setSectionIndex(sections.length); setShowSources(false); }}>Review</PillButton></View>
      {isReview ? <>
        <Display accessibilityRole="header" size={26}>Review every input</Display>
        <InfoCallout title="Unsigned draft" tone="ink">{editor.formId === 'mc031' ? 'MC-031 must accompany another form or court paper. ' : 'This guide fills selected FL-300 fields. Additional sections, forms and attachments may be required. '}Preparing this PDF does not sign, file or serve it. Any later edits to a downloaded PDF must also be checked across all page captions.</InfoCallout>
        {sections.map((item, index) => <SoftCard key={item.id} title={item.title} right={<PillButton size="sm" disabled={busy} onPress={() => setSectionIndex(index)}>Edit</PillButton>}>
          {item.fields.map((field) => <View key={field.id} style={styles.reviewField}><Text style={styles.label}>{field.label}</Text><Text selectable style={styles.body}>{field.kind === 'check' ? editor.values[field.id] === true ? 'Selected' : 'Not selected' : String(editor.values[field.id] || 'Blank')}</Text></View>)}
        </SoftCard>)}
        <Text style={styles.meta}>{editor.sourceEntryIds.length} source entries recorded for this draft. Only the text shown in the form inputs is printed; source IDs and private notes are not added to the official form.</Text>
        <Check disabled={busy} label="I reviewed the inputs and understand that the generated PDF is an unsigned draft requiring a full page-by-page review." checked={reviewed} onChange={() => setReviewed(!reviewed)} />
        <PillButton tone="primary" disabled={busy || !reviewed} onPress={generate}>{busy ? 'Preparing…' : 'Prepare editable PDF'}</PillButton>
      </> : <SoftCard title={section.title}>
        {section.help ? <Text style={styles.body}>{section.help}</Text> : null}
        <Text style={styles.meta}>Fields marked * are required by this guide. Dates use YYYY-MM-DD.</Text>
        <View style={styles.fields}>{section.fields.map((field) => <FormInput key={field.id} field={field} value={editor.values[field.id]} disabled={busy} onChange={(value) => change(field.id, value)} />)}</View>
        {(section.id === 'declaration' || section.id === 'facts') ? <View style={styles.sources}>
          <PillButton disabled={busy} onPress={() => setShowSources(!showSources)}>{showSources ? 'Hide source entries' : 'Insert journal text'}</PillButton>
          {showSources ? <>
            <Text style={styles.meta}>Choose a source to copy its recorded date and factual text. Private entries and private notes are excluded. Review and edit any copied text.</Text>
            {!sources.length ? <Text style={styles.body}>No shareable entries are available in this case.</Text> : sources.map((entry) => <View style={styles.source} key={entry.id}>
              <Text style={styles.label}>{entry.event_date} · {entry.title || 'Journal entry'}</Text><Text selectable style={styles.body}>{entry.body || 'No factual text recorded.'}</Text>
              <PillButton disabled={busy || editor.sourceEntryIds.includes(entry.id) || !entry.body?.trim()} onPress={() => insertSource(entry)}>{editor.sourceEntryIds.includes(entry.id) ? 'Already inserted' : 'Insert this text'}</PillButton>
            </View>)}
          </> : null}
        </View> : null}
      </SoftCard>}
      <View style={styles.actions}><PillButton disabled={busy || sectionIndex === 0} onPress={() => { setSectionIndex((index) => index - 1); setShowSources(false); }}>Previous</PillButton>{!isReview ? <PillButton tone="primary" disabled={busy} onPress={() => { setSectionIndex((index) => index + 1); setShowSources(false); }}>{sectionIndex === sections.length - 1 ? 'Review inputs' : 'Next section'}</PillButton> : null}</View>
    </>}
  </CaseScreen>;
}

const styles = StyleSheet.create({
  content: { gap: fbSpacing.x4 },
  eyebrow: { fontFamily: fbFonts.monoMedium, fontSize: 11, letterSpacing: 1.1, color: fbColors.inkMute },
  body: { fontFamily: fbFonts.sansRegular, fontSize: 14, lineHeight: 21, color: fbColors.ink },
  meta: { fontFamily: fbFonts.sansRegular, fontSize: 12, lineHeight: 18, color: fbColors.inkMute },
  notice: { padding: fbSpacing.x4, borderRadius: fbRadii.md, backgroundColor: fbColors.paperDeep, color: fbColors.ink, fontFamily: fbFonts.sansRegular, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: fbSpacing.x2, marginTop: fbSpacing.x3 },
  fields: { gap: fbSpacing.x4, marginTop: fbSpacing.x4 },
  field: { gap: fbSpacing.x2 },
  label: { fontFamily: fbFonts.sansMedium, fontSize: 13, lineHeight: 19, color: fbColors.ink },
  input: { minHeight: fbTouch.min, borderWidth: fbBorder.hairline, borderColor: fbColors.rule, borderRadius: fbRadii.md, padding: fbSpacing.x3, backgroundColor: fbColors.paper, fontFamily: fbFonts.sansRegular, color: fbColors.ink, fontSize: 16, lineHeight: 23 },
  multiline: { minHeight: 160, textAlignVertical: 'top' },
  check: { minHeight: fbTouch.min, flexDirection: 'row', alignItems: 'center', gap: fbSpacing.x2, padding: fbSpacing.x3, borderWidth: fbBorder.hairline, borderColor: fbColors.rule, borderRadius: fbRadii.md },
  checked: { backgroundColor: fbColors.paperDeep, borderColor: fbColors.ink },
  checkMark: { color: fbColors.ink, fontSize: 19 },
  checkText: { flexShrink: 1, fontFamily: fbFonts.sansRegular, color: fbColors.ink, fontSize: 14, lineHeight: 21 },
  sources: { marginTop: fbSpacing.x4, gap: fbSpacing.x3 },
  source: { gap: fbSpacing.x2, borderTopWidth: fbBorder.hairline, borderColor: fbColors.rule, paddingTop: fbSpacing.x3 },
  reviewField: { gap: 4, paddingVertical: fbSpacing.x2, borderBottomWidth: fbBorder.hairline, borderColor: fbColors.rule },
});
