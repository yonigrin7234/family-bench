import { View, Text, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Pencil, Trash2, AlertTriangle, MapPin, Users, Clock } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { useEntriesStore } from '@/stores/entries';
import { entryTypeLabels } from '@/constants/theme';

function formatDateTime(date: string, time?: string): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  if (!time) return dateStr;
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${dateStr} at ${h12}:${minutes} ${ampm}`;
}

export default function EntryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntriesStore((s) => s.entries.find((e) => e.id === id));
  const softDeleteEntry = useEntriesStore((s) => s.softDeleteEntry);

  if (!entry) {
    return (
      <SafeAreaView className="flex-1 bg-page dark:bg-dark-page items-center justify-center">
        <Text className="font-ui text-[15px] text-text-muted">Entry not found</Text>
      </SafeAreaView>
    );
  }

  const lateMinutes = entry.metadata?.late_minutes as number | undefined;

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      {/* Header */}
      <View className="h-11 flex-row items-center justify-between px-4">
        <IconButton icon={ArrowLeft} variant="surface" onPress={() => router.back()} />
        <Badge type={entry.entry_type as any} />
        <IconButton icon={Pencil} variant="surface" onPress={() => {/* TODO: edit */}} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      >
        {/* Date + time */}
        <Text className="font-display text-[22px] font-semibold text-text-primary dark:text-dark-text">
          {entryTypeLabels[entry.entry_type] ?? entry.entry_type}
        </Text>
        <Text className="font-ui text-[13px] text-text-muted dark:text-dark-text-muted">
          {formatDateTime(entry.event_date, entry.event_time)}
        </Text>

        {/* Late minutes callout */}
        {lateMinutes != null && lateMinutes > 0 && (
          <View className="bg-danger-light rounded-card p-3 flex-row items-center gap-2">
            <AlertTriangle size={18} strokeWidth={1.75} color="#DC2626" />
            <Text className="font-ui text-[14px] font-medium text-danger">
              {lateMinutes} minutes late
            </Text>
          </View>
        )}

        {/* Custody period */}
        {entry.custody_period && (
          <View className="flex-row items-center gap-2">
            <Clock size={16} strokeWidth={1.75} className="text-text-muted" />
            <Text className="font-ui text-[13px] text-text-muted">
              {entry.custody_period === 'my_time' ? 'My custody time' :
               entry.custody_period === 'their_time' ? "Other parent's time" : 'Transition'}
            </Text>
          </View>
        )}

        <Separator />

        {/* Body */}
        {entry.body && (
          <Text className="font-ui text-[15px] text-text-primary dark:text-dark-text leading-relaxed">
            {entry.body}
          </Text>
        )}

        {/* Voice transcript — side-by-side reveal */}
        {entry.voice_transcript && (
          <View className="gap-3">
            <View className="bg-page dark:bg-dark-page rounded-card p-3">
              <Text className="font-ui text-[11px] font-medium text-text-muted mb-1">
                What you said
              </Text>
              <Text className="font-ui text-[13px] text-text-muted leading-relaxed">
                {entry.voice_transcript}
              </Text>
            </View>
            <View className="bg-surface dark:bg-dark-surface border border-border rounded-card p-3">
              <Text className="font-ui text-[11px] font-medium text-accent mb-1">
                Structured as evidence
              </Text>
              <Text className="font-ui text-[15px] text-text-primary dark:text-dark-text leading-relaxed">
                {entry.body}
              </Text>
            </View>
          </View>
        )}

        <Separator />

        {/* Metadata */}
        <View className="gap-3">
          {entry.location_name && (
            <View className="flex-row items-center gap-2">
              <MapPin size={16} strokeWidth={1.75} className="text-text-muted" />
              <Text className="font-ui text-[14px] text-text-muted">{entry.location_name}</Text>
            </View>
          )}
          {entry.people_present && entry.people_present.length > 0 && (
            <View className="flex-row items-center gap-2">
              <Users size={16} strokeWidth={1.75} className="text-text-muted" />
              <Text className="font-ui text-[14px] text-text-muted">
                {entry.people_present.join(', ')}
              </Text>
            </View>
          )}
          {entry.child_mood && (
            <View className="flex-row items-center gap-2">
              <Text className="font-ui text-[13px] text-text-muted">Child's mood:</Text>
              <Text className="font-ui text-[14px] text-text-primary dark:text-dark-text">
                {entry.child_mood}
              </Text>
            </View>
          )}
        </View>

        {/* Flagged indicator */}
        {entry.is_flagged && (
          <>
            <Separator />
            <View className="bg-danger-light rounded-card p-3 flex-row items-center gap-2">
              <AlertTriangle size={16} strokeWidth={1.75} color="#DC2626" />
              <Text className="font-ui text-[14px] text-danger font-medium">
                Flagged: {entry.flag_category} ({entry.flag_severity})
              </Text>
            </View>
          </>
        )}

        {/* Delete */}
        <Separator />
        <Button
          variant="destructive"
          label="Delete entry"
          icon={Trash2}
          onPress={() => {
            softDeleteEntry(entry.id);
            router.back();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
