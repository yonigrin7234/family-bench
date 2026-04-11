import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
import { DeadlineAlert } from '@/components/dashboard/DeadlineAlert';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { useState } from 'react';
import { View as RNView, Text as RNText, Pressable } from 'react-native';

interface KeyDate {
  id: string;
  title: string;
  eventDate: string;
  dateType: string;
  daysRemaining: number;
}

const dateTypes = [
  { key: 'hearing', label: 'Hearing' },
  { key: 'filing_deadline', label: 'Filing deadline' },
  { key: 'response_deadline', label: 'Response deadline' },
  { key: 'mediation', label: 'Mediation' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'other', label: 'Other' },
];

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function KeyDatesScreen() {
  const router = useRouter();
  const [dates, setDates] = useState<KeyDate[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('hearing');

  const addDate = () => {
    if (!newTitle.trim() || !newDate.trim()) return;

    setDates([
      ...dates,
      {
        id: crypto.randomUUID(),
        title: newTitle,
        eventDate: newDate,
        dateType: newType,
        daysRemaining: daysUntil(newDate),
      },
    ].sort((a, b) => a.daysRemaining - b.daysRemaining));

    setNewTitle('');
    setNewDate('');
    setNewType('hearing');
    setAdding(false);

    // TODO: persist to Supabase key_dates table + schedule push notification
  };

  if (adding) {
    return (
      <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
        <View className="h-11 flex-row items-center justify-between px-4">
          <IconButton icon={ArrowLeft} variant="transparent" onPress={() => setAdding(false)} />
          <Text className="font-ui text-[16px] font-medium text-text-primary dark:text-dark-text">
            Add date
          </Text>
          <View className="w-11" />
        </View>

        <View className="flex-1 px-4 pt-4 gap-4">
          <Input label="Title" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Custody hearing" />
          <Input label="Date" value={newDate} onChangeText={setNewDate} placeholder="YYYY-MM-DD" />

          <View className="gap-1.5">
            <Text className="font-ui text-[13px] text-text-muted">Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {dateTypes.map((dt) => (
                <Pressable
                  key={dt.key}
                  onPress={() => setNewType(dt.key)}
                  className={`px-3 py-2 rounded-button border ${
                    newType === dt.key ? 'border-accent bg-accent-lighter' : 'border-border bg-surface'
                  }`}
                >
                  <Text className={`font-ui text-[13px] ${newType === dt.key ? 'text-accent font-medium' : 'text-text-muted'}`}>
                    {dt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button variant="accent" label="Save date" onPress={addDate} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      <View className="h-11 flex-row items-center justify-between px-4">
        <IconButton icon={ArrowLeft} variant="transparent" onPress={() => router.back()} />
        <Text className="font-ui text-[16px] font-medium text-text-primary dark:text-dark-text">
          Key dates
        </Text>
        <IconButton icon={Plus} variant="surface" onPress={() => setAdding(true)} />
      </View>

      {dates.length === 0 ? (
        <EmptyState
          title="No dates set"
          description="Add your next hearing date, filing deadlines, and mediation sessions. We'll remind you as they approach."
          actionLabel="Add a date"
          actionIcon={Plus}
          onAction={() => setAdding(true)}
        />
      ) : (
        <FlatList
          data={dates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <DeadlineAlert
              title={item.title}
              dueDate={item.eventDate}
              daysRemaining={item.daysRemaining}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
