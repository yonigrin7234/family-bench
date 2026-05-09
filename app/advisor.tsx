import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  Icon,
  InfoCallout,
  PillButton,
  Rule,
  SoftCard,
  fbAlpha,
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
import {
  formatDateLabel,
  getEntryTypeOption,
  useAdvisorConversation,
  type AdvisorMessage,
  type Entry,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

const SUGGESTED_PROMPTS = [
  'What should I document next?',
  'Help me organize this event.',
  'What facts are missing?',
  'How could this support a filing package?',
  'Show me entries linked to filings.',
] as const;

const PLACEHOLDER_THREADS = [
  'Main advisor thread',
  'Filing preparation placeholder',
  'Evidence review placeholder',
] as const;

function titleForEntry(entry: Entry) {
  return entry.title || getEntryTypeOption(entry.entry_type).defaultTitle;
}

function MessageBubble({
  message,
  linkedEntries,
  isDesktop = false,
}: {
  message: AdvisorMessage;
  linkedEntries: Entry[];
  isDesktop?: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      <View
        style={[
          styles.messageBubble,
          isDesktop && styles.desktopMessageBubble,
          isUser ? styles.userBubble : styles.advisorBubble,
        ]}
      >
        <View style={styles.messageHeader}>
          <Chip tone={isUser ? 'ink' : 'forest'} outline={false}>
            {isUser ? 'You' : 'Advisor placeholder'}
          </Chip>
          <Text style={styles.messageMeta}>Local static response</Text>
        </View>
        <Text style={styles.messageBody}>{message.body}</Text>
        {!isUser ? (
          <View style={styles.linkedBlock}>
            <Rule />
            <View style={styles.linkedHeader}>
              <Icon name="link" size={14} color={fbColors.inkMute} />
              <Text style={styles.linkedTitle}>LINKED ENTRIES PLACEHOLDER</Text>
            </View>
            {linkedEntries.length ? (
              <View style={styles.linkedStack}>
                {linkedEntries.map((entry) => {
                  const option = getEntryTypeOption(entry.entry_type);

                  return (
                    <View key={entry.id} style={styles.linkedEntryRow}>
                      <Icon name={option.icon as IconName} size={13} color={fbColors.ink} />
                      <View style={styles.linkedEntryCopy}>
                        <Text style={styles.linkedEntryTitle}>{titleForEntry(entry)}</Text>
                        <Text style={styles.linkedEntryMeta}>
                          {formatDateLabel(entry.event_date, entry.event_time)} · {option.shortLabel}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.linkedEmpty}>
                No entries are linked to this placeholder response yet.
              </Text>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SuggestedPrompt({
  prompt,
  onPress,
}: {
  prompt: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ask advisor: ${prompt}`}
      onPress={onPress}
      style={({ pressed }) => [styles.promptPressable, pressed && styles.pressed]}
    >
      <SoftCard p={12} style={styles.promptCard}>
        <Text style={styles.promptText}>{prompt}</Text>
      </SoftCard>
    </Pressable>
  );
}

function AdvisorComposer({
  input,
  onChangeInput,
  onSubmit,
  desktop = false,
}: {
  input: string;
  onChangeInput: (value: string) => void;
  onSubmit: () => void;
  desktop?: boolean;
}) {
  return (
    <View style={[styles.footer, desktop && styles.desktopComposer]}>
      <TextInput
        value={input}
        onChangeText={onChangeInput}
        placeholder="Ask a factual organization question"
        placeholderTextColor={fbColors.inkFaint}
        multiline
        textAlignVertical="top"
        style={[styles.input, desktop && styles.desktopInput]}
      />
      <PillButton
        tone="primary"
        size="lg"
        full
        icon="chat"
        disabled={!input.trim()}
        onPress={onSubmit}
      >
        Send placeholder
      </PillButton>
    </View>
  );
}

function ConversationCard({
  messages,
  entriesById,
  isDesktop,
}: {
  messages: AdvisorMessage[];
  entriesById: Map<string, Entry>;
  isDesktop: boolean;
}) {
  return (
    <SoftCard p={16} style={[styles.threadCard, isDesktop && styles.desktopThreadCard]}>
      <View style={styles.contextHeader}>
        <View style={styles.contextTitleRow}>
          <Icon name="chat" size={16} color={fbColors.ink} />
          <Text style={styles.sectionTitle}>Conversation</Text>
        </View>
        <Chip tone={messages.length ? 'ink' : 'mute'} outline={false}>
          {messages.length}
        </Chip>
      </View>

      {messages.length ? (
        <View style={styles.messageStack}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isDesktop={isDesktop}
              linkedEntries={message.linkedEntryIds
                .map((entryId) => entriesById.get(entryId))
                .filter((entry): entry is Entry => Boolean(entry))}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyTitle}>Conversation history placeholder</Text>
          <Text style={styles.emptyBody}>
            Ask a suggested prompt or type a question. The static response will be saved locally in
            this thread.
          </Text>
        </View>
      )}
    </SoftCard>
  );
}

function DesktopThreadRail({
  messagesCount,
  onPrompt,
}: {
  messagesCount: number;
  onPrompt: (prompt: string) => void;
}) {
  return (
    <SoftCard p={16} style={styles.desktopThreadRail}>
      <View style={styles.contextHeader}>
        <View style={styles.contextTitleRow}>
          <Icon name="pin" size={16} color={fbColors.ink} />
          <Text style={styles.sectionTitle}>Threads</Text>
        </View>
        <Chip tone="amber" outline={false}>
          Local
        </Chip>
      </View>

      <View style={styles.threadSummary}>
        <Text style={styles.threadSummaryTitle}>Current thread</Text>
        <Text style={styles.threadSummaryBody}>
          Main advisor thread · {Math.floor(messagesCount / 2)} local exchanges saved on this device.
        </Text>
      </View>

      <Rule />

      <View style={styles.railBlock}>
        <Text style={styles.sectionLabel}>PINNED PROMPTS</Text>
        <View style={styles.desktopPromptStack}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Pressable
              key={prompt}
              accessibilityRole="button"
              accessibilityLabel={`Ask advisor: ${prompt}`}
              onPress={() => onPrompt(prompt)}
              style={({ pressed }) => [styles.desktopPromptButton, pressed && styles.pressed]}
            >
              <Text style={styles.desktopPromptText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Rule />

      <View style={styles.railBlock}>
        <Text style={styles.sectionLabel}>RECENT THREADS</Text>
        <View style={styles.placeholderThreadStack}>
          {PLACEHOLDER_THREADS.map((thread) => (
            <View key={thread} style={styles.placeholderThreadRow}>
              <Icon name="chat" size={13} color={fbColors.inkMute} />
              <Text style={styles.placeholderThreadText}>{thread}</Text>
            </View>
          ))}
        </View>
      </View>
    </SoftCard>
  );
}

function AdvisorContextRail({
  caseTitle,
  upcomingHearingLabel,
  flaggedEntries,
  recentEntries,
  persisted,
}: {
  caseTitle: string;
  upcomingHearingLabel: string | null;
  flaggedEntries: Entry[];
  recentEntries: Entry[];
  persisted: boolean;
}) {
  return (
    <SoftCard p={14} style={styles.contextRailCard}>
      <Text style={styles.sectionLabel}>CASE CONTEXT</Text>
      <Text style={styles.railTitle}>{caseTitle}</Text>
      <Text style={styles.railBody}>
        Advisor responses are local static placeholders. {fbLegalCopy.legalInformationNotAdvice}
      </Text>
      <Rule />

      <View style={styles.railMetricStack}>
        <View style={styles.railMetric}>
          <Text style={styles.contextLabel}>NEXT DATE</Text>
          <Text style={styles.contextValue}>{upcomingHearingLabel || 'Not recorded'}</Text>
        </View>
        <View style={styles.railMetric}>
          <Text style={styles.contextLabel}>FLAGGED ENTRIES</Text>
          <Text style={styles.contextValue}>{flaggedEntries.length} available for review</Text>
        </View>
        <View style={styles.railMetric}>
          <Text style={styles.contextLabel}>LOCAL STATE</Text>
          <Text style={styles.contextValue}>{persisted ? 'Persisted locally' : 'Local session'}</Text>
        </View>
      </View>

      <Rule />

      <Text style={styles.sectionLabel}>RECENT ENTRIES</Text>
      {recentEntries.length ? (
        <View style={styles.recentEntryStack}>
          {recentEntries.map((entry) => {
            const option = getEntryTypeOption(entry.entry_type);
            return (
              <View key={entry.id} style={styles.railEntryRow}>
                <Icon name={option.icon as IconName} size={13} color={fbColors.ink} />
                <View style={styles.linkedEntryCopy}>
                  <Text style={styles.linkedEntryTitle}>{titleForEntry(entry)}</Text>
                  <Text style={styles.linkedEntryMeta}>
                    {formatDateLabel(entry.event_date, entry.event_time)} · {option.shortLabel}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.railBody}>No recent entries are available for this case yet.</Text>
      )}

      <Rule />

      <Text style={styles.sectionLabel}>LINKED ENTRIES</Text>
      <Text style={styles.railBody}>
        Future advisor responses can pin specific entries here. This placeholder does not create legal
        advice or call an AI service.
      </Text>
    </SoftCard>
  );
}

export default function Advisor() {
  const {
    advisorState,
    sendAdvisorMessage,
    activeCase,
    upcomingHearing,
    flaggedEntries,
    snapshot,
    persistence,
  } = useAdvisorConversation();
  const { isMobile } = useResponsive();
  const [input, setInput] = useState('');
  const messages = advisorState.messages;
  const caseTitle = activeCase?.title || 'Current case';
  const upcomingHearingLabel = upcomingHearing
    ? `${upcomingHearing.title} · ${formatDateLabel(upcomingHearing.event_date, upcomingHearing.event_time)}`
    : null;
  const entriesById = useMemo(() => {
    return new Map(snapshot.entries.map((entry) => [entry.id, entry]));
  }, [snapshot.entries]);
  const recentEntries = useMemo(() => {
    return snapshot.entries
      .filter((entry) => !entry.deleted_at && (!activeCase?.id || entry.case_id === activeCase.id))
      .sort((a, b) =>
        `${b.event_date}T${b.event_time ?? '00:00:00'}`.localeCompare(
          `${a.event_date}T${a.event_time ?? '00:00:00'}`,
        ),
      )
      .slice(0, 4);
  }, [activeCase?.id, snapshot.entries]);

  function submitPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    sendAdvisorMessage({
      prompt: trimmed,
      caseTitle,
      upcomingHearingLabel,
      flaggedEntriesCount: flaggedEntries.length,
      linkedEntryIds: flaggedEntries.slice(0, 4).map((entry) => entry.id),
    });
    setInput('');
  }

  const composer = (
    <AdvisorComposer
      input={input}
      onChangeInput={setInput}
      onSubmit={() => submitPrompt(input)}
      desktop={!isMobile}
    />
  );
  const conversationCard = (
    <ConversationCard messages={messages} entriesById={entriesById} isDesktop={!isMobile} />
  );

  return (
    <CaseScreen
      desktopMaxWidth={1040}
      footer={isMobile ? composer : undefined}
      rightRail={
        isMobile ? undefined : (
          <AdvisorContextRail
            caseTitle={caseTitle}
            upcomingHearingLabel={upcomingHearingLabel}
            flaggedEntries={flaggedEntries}
            recentEntries={recentEntries}
            persisted={persistence.active}
          />
        )
      }
    >
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone="forest" outline={false}>
            Local
          </Chip>
          <Chip tone="mute" outline={false}>
            Static responses
          </Chip>
        </View>
        <Display italic size={32} style={styles.title}>
          Advisor
        </Display>
        <Text style={styles.subtitle}>
          A calm case companion for organizing facts. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      {isMobile ? (
        <>
          <InfoCallout title="Advisor limits" tone="ink">
            This MVP uses local placeholder responses only. It does not call AI, predict outcomes,
            provide legal advice, or write to a remote database.
          </InfoCallout>

          <SoftCard p={16} style={styles.contextCard}>
            <View style={styles.contextHeader}>
              <View style={styles.contextTitleRow}>
                <Icon name="spark" size={16} color={fbColors.ink} />
                <Text style={styles.sectionTitle}>Case context placeholders</Text>
              </View>
              <Chip tone={persistence.active ? 'forest' : 'mute'} outline={false}>
                {persistence.active ? 'Persisted' : 'Local'}
              </Chip>
            </View>
            <View style={styles.contextGrid}>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>CASE</Text>
                <Text style={styles.contextValue}>{caseTitle}</Text>
              </View>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>UPCOMING HEARING</Text>
                <Text style={styles.contextValue}>{upcomingHearingLabel || 'Not recorded'}</Text>
              </View>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>FLAGGED ENTRIES</Text>
                <Text style={styles.contextValue}>{flaggedEntries.length} available for review</Text>
              </View>
            </View>
          </SoftCard>

          <SoftCard p={16} style={styles.pinnedCard}>
            <View style={styles.contextHeader}>
              <View style={styles.contextTitleRow}>
                <Icon name="pin" size={16} color={fbColors.ink} />
                <Text style={styles.sectionTitle}>Pinned thread</Text>
              </View>
              <Chip tone="amber" outline={false}>
                Placeholder
              </Chip>
            </View>
            <Text style={styles.sectionBody}>
              Main advisor thread · {Math.floor(messages.length / 2)} local exchanges saved on this
              device.
            </Text>
          </SoftCard>

          <View style={styles.promptSection}>
            <Text style={styles.sectionLabel}>SUGGESTED PROMPTS</Text>
            <View style={styles.promptGrid}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <SuggestedPrompt key={prompt} prompt={prompt} onPress={() => submitPrompt(prompt)} />
              ))}
            </View>
          </View>

          {conversationCard}
        </>
      ) : (
        <View style={styles.desktopWorkspace}>
          <View style={styles.desktopLeftColumn}>
            <DesktopThreadRail messagesCount={messages.length} onPrompt={submitPrompt} />
          </View>
          <View style={styles.desktopConversationColumn}>
            <InfoCallout title="Advisor limits" tone="ink">
              This workspace uses local placeholder responses only. It does not call AI, predict outcomes,
              provide legal advice, or write to a remote database.
            </InfoCallout>
            {conversationCard}
            {composer}
          </View>
        </View>
      )}
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
    marginTop: fbSpacing.x2,
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
  contextCard: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
  },
  pinnedCard: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x3,
  },
  contextHeader: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  contextTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  sectionTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  sectionBody: {
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  contextGrid: {
    gap: fbSpacing.x2,
  },
  contextItem: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    backgroundColor: fbColors.paperDeep,
  },
  contextLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  contextValue: {
    marginTop: fbSpacing.x1,
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  promptSection: {
    marginTop: fbSpacing.x5,
  },
  sectionLabel: {
    color: fbColors.ox,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1.05,
  },
  promptGrid: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x2,
  },
  promptPressable: {
    minHeight: fbTouch.min,
  },
  promptCard: {
    minHeight: fbTouch.min,
    justifyContent: 'center',
  },
  promptText: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  desktopWorkspace: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x4,
  },
  desktopLeftColumn: {
    width: 300,
    flexShrink: 0,
  },
  desktopConversationColumn: {
    flex: 1,
    minWidth: 0,
    gap: fbSpacing.x4,
  },
  desktopThreadRail: {
    gap: fbSpacing.x4,
  },
  railBlock: {
    gap: fbSpacing.x3,
  },
  threadSummary: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    backgroundColor: fbColors.paperDeep,
    gap: fbSpacing.x1,
  },
  threadSummaryTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  threadSummaryBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  desktopPromptStack: {
    gap: fbSpacing.x2,
  },
  desktopPromptButton: {
    minHeight: fbTouch.min,
    justifyContent: 'center',
    paddingHorizontal: fbSpacing.x3,
    paddingVertical: fbSpacing.x2,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.surface,
  },
  desktopPromptText: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  placeholderThreadStack: {
    gap: fbSpacing.x2,
  },
  placeholderThreadRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  placeholderThreadText: {
    flex: 1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  threadCard: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  desktopThreadCard: {
    marginTop: 0,
  },
  messageStack: {
    gap: fbSpacing.x3,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    width: '92%',
    gap: fbSpacing.x3,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
  },
  desktopMessageBubble: {
    width: '82%',
  },
  advisorBubble: {
    backgroundColor: fbColors.paperDeep,
    borderColor: fbColors.ruleSoft,
  },
  userBubble: {
    backgroundColor: fbColors.surface,
    borderColor: fbColors.inkFaint,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x2,
  },
  messageMeta: {
    flexShrink: 1,
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    textAlign: 'right',
    fontFamily: fbFonts.sansRegular,
  },
  messageBody: {
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  linkedBlock: {
    gap: fbSpacing.x3,
  },
  linkedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  linkedTitle: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  linkedStack: {
    gap: fbSpacing.x2,
  },
  linkedEntryRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
    padding: fbSpacing.x2,
    borderRadius: fbRadii.sm,
    backgroundColor: fbColors.surface,
  },
  linkedEntryCopy: {
    flex: 1,
  },
  linkedEntryTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 17,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  linkedEntryMeta: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 17,
    fontFamily: fbFonts.sansRegular,
  },
  linkedEmpty: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  emptyHistory: {
    padding: fbSpacing.x4,
    borderRadius: fbRadii.md,
    backgroundColor: fbColors.paperDeep,
  },
  emptyTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  emptyBody: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  footer: {
    gap: fbSpacing.x2,
    paddingTop: fbSpacing.x2,
    backgroundColor: fbColors.paper,
  },
  desktopComposer: {
    marginTop: 0,
    padding: fbSpacing.x4,
    borderRadius: fbRadii.lg,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  input: {
    minHeight: 64,
    maxHeight: 112,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    paddingHorizontal: fbSpacing.x3,
    paddingTop: fbSpacing.x3,
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  desktopInput: {
    minHeight: 88,
  },
  contextRailCard: {
    gap: fbSpacing.x3,
  },
  railTitle: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    lineHeight: 23,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  railBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  railMetricStack: {
    gap: fbSpacing.x2,
  },
  railMetric: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    backgroundColor: fbColors.paperDeep,
  },
  recentEntryStack: {
    gap: fbSpacing.x2,
  },
  railEntryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x2,
    paddingVertical: fbSpacing.x2,
  },
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
});
