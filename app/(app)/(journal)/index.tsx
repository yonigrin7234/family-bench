import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { EntryCard } from '@/components/entries/EntryCard';
import { QuickEntryBar } from '@/components/entries/QuickEntryBar';
import { CaptureSheet } from '@/components/entries/CaptureSheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { EntryFilters } from '@/components/entries/EntryFilters';
import { PageHeader } from '@/components/layout/PageHeader';
import { useFilteredEntries, useEntriesStore } from '@/stores/entries';
import type { Entry } from '@/stores/entries';

export default function JournalScreen() {
  const router = useRouter();
  const entries = useFilteredEntries();
  const loading = useEntriesStore((s) => s.loading);
  const [captureVisible, setCaptureVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: PowerSync refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderEntry = useCallback(
    ({ item }: { item: Entry }) => (
      <EntryCard
        id={item.id}
        entryType={item.entry_type as keyof typeof import('@/constants/theme').entryBadgeColors}
        title={item.title}
        body={item.body}
        eventDate={item.event_date}
        eventTime={item.event_time}
        locationName={item.location_name}
        isFlagged={item.is_flagged}
        flagSeverity={item.flag_severity}
        hasAttachments={item.has_attachments}
        hasAudio={item.has_audio}
        peoplePresent={item.people_present}
        metadata={item.metadata}
        onPress={() => router.push(`/(app)/(journal)/${item.id}`)}
      />
    ),
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      <PageHeader
        title="Journal"
        rightIcon={Plus}
        onRightPress={() => setCaptureVisible(true)}
      />

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListHeaderComponent={<EntryFilters />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No entries yet"
            description="Start by recording what happened today. Tap the microphone to speak or the + button to write."
            actionLabel="Add first entry"
            actionIcon={Plus}
            onAction={() => setCaptureVisible(true)}
          />
        }
        // Virtualization for 1000+ entries
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={15}
        getItemLayout={(_, index) => ({
          length: 140, // approximate card height
          offset: 140 * index,
          index,
        })}
      />

      <QuickEntryBar
        onPress={() => router.push('/(app)/(journal)/new')}
        onMicPress={() => {
          // TODO: Voice capture
          router.push('/(app)/(journal)/new');
        }}
      />

      <CaptureSheet
        visible={captureVisible}
        onDismiss={() => setCaptureVisible(false)}
        onVoiceEntry={() => router.push('/(app)/(journal)/new?type=journal')}
        onExchangeLog={() => router.push('/(app)/(journal)/new?type=pickup_dropoff')}
        onPhoto={() => router.push('/(app)/(journal)/new?type=journal&capture=photo')}
        onTextNote={() => router.push('/(app)/(journal)/new?type=journal')}
      />
    </SafeAreaView>
  );
}
