import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, ChevronDown } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { useEntriesStore } from '@/stores/entries';
import { baseEntrySchema, entryTypes } from '@/schemas/entry';
import { entryTypeLabels } from '@/constants/theme';
import type { EntryType } from '@/schemas/entry';

// Per-type metadata fields
function ExchangeFields({ control }: { control: any }) {
  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="metadata.scheduled_time"
        render={({ field: { onChange, value } }) => (
          <Input label="Scheduled time" value={value} onChangeText={onChange} placeholder="3:00 PM" />
        )}
      />
      <Controller
        control={control}
        name="metadata.actual_time"
        render={({ field: { onChange, value } }) => (
          <Input label="Actual time" value={value} onChangeText={onChange} placeholder="3:23 PM" />
        )}
      />
      <Controller
        control={control}
        name="metadata.transfer_method"
        render={({ field: { onChange, value } }) => (
          <View className="gap-1.5">
            <Text className="font-ui text-[13px] text-text-muted">Transfer method</Text>
            <View className="flex-row gap-2">
              {(['in_person', 'school', 'third_party'] as const).map((method) => (
                <Pressable
                  key={method}
                  onPress={() => onChange(method)}
                  className={`px-3 py-2 rounded-button border ${
                    value === method ? 'border-accent bg-accent-lighter' : 'border-border bg-surface'
                  }`}
                >
                  <Text className={`font-ui text-[13px] ${value === method ? 'text-accent' : 'text-text-muted'}`}>
                    {method === 'in_person' ? 'In person' : method === 'school' ? 'School' : 'Third party'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

function ExpenseFields({ control }: { control: any }) {
  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="metadata.amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Amount"
            value={value?.toString() ?? ''}
            onChangeText={(t) => onChange(parseFloat(t) || 0)}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        )}
      />
      <Controller
        control={control}
        name="metadata.category"
        render={({ field: { onChange, value } }) => (
          <View className="gap-1.5">
            <Text className="font-ui text-[13px] text-text-muted">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {['medical', 'education', 'extracurricular', 'clothing', 'childcare', 'other'].map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => onChange(cat)}
                  className={`px-3 py-2 rounded-button border ${
                    value === cat ? 'border-accent bg-accent-lighter' : 'border-border bg-surface'
                  }`}
                >
                  <Text className={`font-ui text-[13px] ${value === cat ? 'text-accent' : 'text-text-muted'}`}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

function DeniedVisitFields({ control }: { control: any }) {
  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="metadata.reason_given"
        render={({ field: { onChange, value } }) => (
          <Input label="Reason given (if any)" value={value} onChangeText={onChange} placeholder="What reason was provided?" />
        )}
      />
      <Controller
        control={control}
        name="metadata.actions_taken"
        render={({ field: { onChange, value } }) => (
          <TextArea
            label="Actions taken"
            value={value?.join('\n') ?? ''}
            onChangeText={(t) => onChange(t.split('\n').filter(Boolean))}
            placeholder="What did you do in response?"
          />
        )}
      />
    </View>
  );
}

function ChildStatementFields({ control }: { control: any }) {
  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="metadata.verbatim_quote"
        render={({ field: { onChange, value } }) => (
          <TextArea
            label="Exact words (verbatim)"
            value={value}
            onChangeText={onChange}
            placeholder="What exactly did the child say?"
          />
        )}
      />
      <Controller
        control={control}
        name="metadata.context"
        render={({ field: { onChange, value } }) => (
          <Input label="Context" value={value} onChangeText={onChange} placeholder="What was happening when they said this?" />
        )}
      />
    </View>
  );
}

// Mood selector chips
function MoodSelector({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const moods = [
    { key: 'great', label: 'Great' },
    { key: 'good', label: 'Good' },
    { key: 'okay', label: 'Okay' },
    { key: 'upset', label: 'Upset' },
    { key: 'distressed', label: 'Distressed' },
  ];

  return (
    <View className="gap-1.5">
      <Text className="font-ui text-[13px] text-text-muted">Child's mood</Text>
      <View className="flex-row gap-2">
        {moods.map((mood) => (
          <Pressable
            key={mood.key}
            onPress={() => onChange(mood.key)}
            className={`px-3 py-2 rounded-button border ${
              value === mood.key ? 'border-accent bg-accent-lighter' : 'border-border bg-surface'
            }`}
          >
            <Text className={`font-ui text-[13px] ${value === mood.key ? 'text-accent' : 'text-text-muted'}`}>
              {mood.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Custody period selector
function CustodyPeriodSelector({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const periods = [
    { key: 'my_time', label: 'My time' },
    { key: 'their_time', label: 'Their time' },
    { key: 'transition', label: 'Transition' },
  ];

  return (
    <View className="gap-1.5">
      <Text className="font-ui text-[13px] text-text-muted">Custody period</Text>
      <View className="flex-row gap-2">
        {periods.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => onChange(p.key)}
            className={`px-3 py-2 rounded-button border ${
              value === p.key ? 'border-accent bg-accent-lighter' : 'border-border bg-surface'
            }`}
          >
            <Text className={`font-ui text-[13px] ${value === p.key ? 'text-accent' : 'text-text-muted'}`}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function NewEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const addEntry = useEntriesStore((s) => s.addEntry);
  const [selectedType, setSelectedType] = useState<EntryType>(
    (params.type as EntryType) ?? 'journal'
  );
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(baseEntrySchema),
    defaultValues: {
      entry_type: selectedType,
      event_date: new Date().toISOString().split('T')[0],
      event_time: new Date().toTimeString().slice(0, 5),
      is_flagged: false,
      body: '',
    },
  });

  const onSubmit = handleSubmit((data) => {
    const entry = {
      id: crypto.randomUUID(),
      user_id: '', // TODO: from auth
      entry_type: selectedType,
      event_date: data.event_date,
      event_time: data.event_time,
      custody_period: data.custody_period,
      title: data.title,
      body: data.body,
      child_mood: data.child_mood,
      is_flagged: data.is_flagged ?? false,
      flag_severity: data.flag_severity,
      flag_category: data.flag_category,
      location_name: data.location_name,
      people_present: data.people_present,
      metadata: (data as any).metadata ?? {},
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addEntry(entry);
    router.back();
  });

  // Type-specific fields
  const typeFields = useMemo(() => {
    switch (selectedType) {
      case 'pickup_dropoff': return <ExchangeFields control={control} />;
      case 'expense': return <ExpenseFields control={control} />;
      case 'visit_denied': return <DeniedVisitFields control={control} />;
      case 'child_statement': return <ChildStatementFields control={control} />;
      default: return null;
    }
  }, [selectedType, control]);

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      {/* Header */}
      <View className="h-11 flex-row items-center justify-between px-4">
        <IconButton icon={X} variant="surface" onPress={() => router.back()} />
        <Text className="font-ui text-[16px] font-medium text-text-primary dark:text-dark-text">
          New entry
        </Text>
        <IconButton icon={Check} variant="accent" onPress={onSubmit} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Entry type selector */}
        <Pressable
          onPress={() => setShowTypeSelector(!showTypeSelector)}
          className="flex-row items-center gap-2"
        >
          <Badge type={selectedType as any} />
          <ChevronDown size={16} strokeWidth={1.75} className="text-text-muted" />
        </Pressable>

        {showTypeSelector && (
          <View className="flex-row flex-wrap gap-2 mb-2">
            {entryTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setSelectedType(type);
                  setShowTypeSelector(false);
                }}
              >
                <Badge type={type} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Custody period */}
        <Controller
          control={control}
          name="custody_period"
          render={({ field: { onChange, value } }) => (
            <CustodyPeriodSelector value={value} onChange={onChange} />
          )}
        />

        {/* Main body */}
        <Controller
          control={control}
          name="body"
          render={({ field: { onChange, value } }) => (
            <TextArea
              label="What happened?"
              value={value}
              onChangeText={onChange}
              placeholder="Describe what happened..."
            />
          )}
        />

        {/* Type-specific fields */}
        {typeFields}

        <Separator />

        {/* Child mood (for journal entries) */}
        {(selectedType === 'journal' || selectedType === 'pickup_dropoff') && (
          <Controller
            control={control}
            name="child_mood"
            render={({ field: { onChange, value } }) => (
              <MoodSelector value={value} onChange={onChange} />
            )}
          />
        )}

        {/* Location */}
        <Controller
          control={control}
          name="location_name"
          render={({ field: { onChange, value } }) => (
            <Input label="Location" value={value} onChangeText={onChange} placeholder="Where did this happen?" />
          )}
        />

        {/* Flag */}
        <Pressable
          onPress={() => {
            // Toggle flag via form
          }}
          className="flex-row items-center gap-3 py-2"
        >
          <View className={`w-5 h-5 rounded border ${false ? 'bg-danger border-danger' : 'border-border'}`} />
          <Text className="font-ui text-[15px] text-text-primary dark:text-dark-text">
            Flag as incident
          </Text>
        </Pressable>

        {/* Save */}
        <Button variant="accent" label="Save entry" onPress={onSubmit} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}
