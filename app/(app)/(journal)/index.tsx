import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { EntryCard } from '@/components/entries/EntryCard';
import { QuickEntryBar } from '@/components/entries/QuickEntryBar';
import { CaptureSheet } from '@/components/entries/CaptureSheet';
import { EntryFilters } from '@/components/entries/EntryFilters';
import { EmptyState } from '@/components/shared/EmptyState';
import { hapticLight } from '@/lib/utils/haptics';
import { useFilteredEntries, useEntriesStore } from '@/stores/entries';
import type { Entry } from '@/stores/entries';

export default function JournalScreen() {
  const router = useRouter();
  const entries = useFilteredEntries();
  const [captureVisible, setCaptureVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderEntry = useCallback(
    ({ item }: { item: Entry }) => (
      <EntryCard
        id={item.id}
        entryType={item.entry_type as any}
        title={item.title}
        body={item.body}
        eventDate={item.event_date}
        eventTime={item.event_time}
        locationName={item.location_name}
        isFlagged={item.is_flagged}
        flagSeverity={item.flag_severity}
        hasAttachments={item.has_attachments}
        hasAudio={item.has_audio}
        metadata={item.metadata}
        onPress={() => router.push(`/(app)/(journal)/${item.id}`)}
      />
    ),
    [router]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      {/* Header: "Journal" left (Georgia serif), + button right */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text style={{ fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: '#1A1A18' }}>
          Journal
        </Text>
        <Pressable
          onPress={() => { hapticLight(); setCaptureVisible(true); }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 3,
            elevation: 2,
          }}
          accessibilityLabel="New entry"
          accessibilityRole="button"
        >
          <Plus size={20} strokeWidth={1.75} color="#2563EB" />
        </Pressable>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingBottom: 120,
          flexGrow: entries.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }}>
            <EntryFilters />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No entries yet"
            description="Start recording what happened today."
            actionLabel="Add first entry"
            onAction={() => setCaptureVisible(true)}
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={15}
        getItemLayout={(_, index) => ({ length: 140, offset: 140 * index, index })}
      />

      <QuickEntryBar
        onPress={() => router.push('/(app)/(journal)/new')}
        onMicPress={() => router.push('/(app)/(journal)/new?type=journal')}
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
