import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, ChevronDown } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { useEntriesStore } from '@/stores/entries';
import { useCamera } from '@/lib/hooks/useCamera';
import { entryTypes } from '@/schemas/entry';
import { entryTypeLabels } from '@/constants/theme';
import type { EntryType } from '@/schemas/entry';
import type { CapturedPhoto } from '@/lib/hooks/useCamera';

// Chip selector shared component
function ChipSelector({ options, selected, onSelect }: {
  options: { key: string; label: string }[];
  selected?: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => onSelect(opt.key)}
          style={{
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
            backgroundColor: selected === opt.key ? '#1A1A18' : '#F0F0EA',
          }}
        >
          <Text style={{
            fontFamily: 'System', fontSize: 13, fontWeight: '500',
            color: selected === opt.key ? '#FFFFFF' : '#6B6A68',
          }}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Form field wrapper
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68' }}>{label}</Text>
      {children}
    </View>
  );
}

// Styled text input
function StyledInput({ placeholder, value, onChangeText, ...props }: {
  placeholder: string; value: string; onChangeText: (t: string) => void;
  multiline?: boolean; keyboardType?: string;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#9A9893"
      value={value}
      onChangeText={onChangeText}
      style={{
        backgroundColor: '#FFFFFF', borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
        paddingHorizontal: 16, paddingVertical: 12,
        fontFamily: 'System', fontSize: 15, color: '#1A1A18',
        minHeight: props.multiline ? 120 : 48,
        textAlignVertical: props.multiline ? 'top' : 'center',
      }}
      multiline={props.multiline}
    />
  );
}

export default function NewEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const addEntry = useEntriesStore((s) => s.addEntry);

  const { takePhoto, pickFromGallery, loading: cameraLoading } = useCamera();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedType, setSelectedType] = useState<EntryType>((params.type as EntryType) ?? 'journal');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [body, setBody] = useState('');
  const [custodyPeriod, setCustodyPeriod] = useState('');
  const [childMood, setChildMood] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isFlagged, setIsFlagged] = useState(false);

  // Exchange fields
  const [scheduledTime, setScheduledTime] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [transferMethod, setTransferMethod] = useState('');

  // Expense fields
  const [amount, setAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');

  // Child statement fields
  const [verbatimQuote, setVerbatimQuote] = useState('');
  const [statementContext, setStatementContext] = useState('');

  // Denied visit fields
  const [reasonGiven, setReasonGiven] = useState('');

  const onSave = () => {
    const now = new Date();
    const metadata: Record<string, unknown> = {};

    if (selectedType === 'pickup_dropoff') {
      metadata.scheduled_time = scheduledTime;
      metadata.actual_time = actualTime;
      metadata.transfer_method = transferMethod;
      if (scheduledTime && actualTime) {
        // Simple late calculation (minutes)
        const [sh, sm] = scheduledTime.split(':').map(Number);
        const [ah, am] = actualTime.split(':').map(Number);
        metadata.late_minutes = Math.max(0, (ah * 60 + am) - (sh * 60 + sm));
      }
    }
    if (selectedType === 'expense') {
      metadata.amount = parseFloat(amount) || 0;
      metadata.category = expenseCategory;
    }
    if (selectedType === 'child_statement') {
      metadata.verbatim_quote = verbatimQuote;
      metadata.context = statementContext;
    }
    if (selectedType === 'visit_denied') {
      metadata.reason_given = reasonGiven;
    }

    addEntry({
      id: crypto.randomUUID(),
      user_id: '',
      entry_type: selectedType,
      event_date: now.toISOString().split('T')[0],
      event_time: now.toTimeString().slice(0, 5),
      custody_period: custodyPeriod || undefined,
      body,
      child_mood: childMood || undefined,
      is_flagged: isFlagged,
      flag_category: isFlagged ? 'other' : undefined,
      flag_severity: isFlagged ? 'medium' : undefined,
      location_name: locationName || undefined,
      metadata,
      is_edited: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 }}
        >
          <X size={20} strokeWidth={1.75} color="#1A1A18" />
        </Pressable>
        <Text style={{ fontFamily: 'Georgia', fontSize: 18, fontWeight: '600', color: '#1A1A18' }}>
          New entry
        </Text>
        <Pressable
          onPress={onSave}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }}
          className="active:scale-[0.98]"
        >
          <Check size={20} strokeWidth={2} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Entry type selector */}
        <Pressable onPress={() => setShowTypeSelector(!showTypeSelector)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Badge type={selectedType as any} />
          <ChevronDown size={16} strokeWidth={1.75} color="#9A9893" />
        </Pressable>

        {showTypeSelector && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {entryTypes.map((type) => (
              <Pressable key={type} onPress={() => { setSelectedType(type); setShowTypeSelector(false); }}>
                <Badge type={type} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Custody period */}
        <FormField label="Custody period">
          <ChipSelector
            options={[
              { key: 'my_time', label: 'My time' },
              { key: 'their_time', label: 'Their time' },
              { key: 'transition', label: 'Transition' },
            ]}
            selected={custodyPeriod}
            onSelect={setCustodyPeriod}
          />
        </FormField>

        {/* Main body */}
        <FormField label="What happened?">
          <StyledInput placeholder="Describe what happened..." value={body} onChangeText={setBody} multiline />
        </FormField>

        {/* Exchange fields */}
        {selectedType === 'pickup_dropoff' && (
          <>
            <FormField label="Scheduled time">
              <StyledInput placeholder="3:00 PM" value={scheduledTime} onChangeText={setScheduledTime} />
            </FormField>
            <FormField label="Actual time">
              <StyledInput placeholder="3:23 PM" value={actualTime} onChangeText={setActualTime} />
            </FormField>
            <FormField label="Transfer method">
              <ChipSelector
                options={[
                  { key: 'in_person', label: 'In person' },
                  { key: 'school', label: 'School' },
                  { key: 'third_party', label: 'Third party' },
                ]}
                selected={transferMethod}
                onSelect={setTransferMethod}
              />
            </FormField>
          </>
        )}

        {/* Expense fields */}
        {selectedType === 'expense' && (
          <>
            <FormField label="Amount">
              <StyledInput placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            </FormField>
            <FormField label="Category">
              <ChipSelector
                options={['medical', 'education', 'extracurricular', 'clothing', 'childcare', 'other'].map(c => ({ key: c, label: c }))}
                selected={expenseCategory}
                onSelect={setExpenseCategory}
              />
            </FormField>
          </>
        )}

        {/* Child statement fields */}
        {selectedType === 'child_statement' && (
          <>
            <FormField label="Exact words (verbatim)">
              <StyledInput placeholder="What exactly did the child say?" value={verbatimQuote} onChangeText={setVerbatimQuote} multiline />
            </FormField>
            <FormField label="Context">
              <StyledInput placeholder="What was happening when they said this?" value={statementContext} onChangeText={setStatementContext} />
            </FormField>
          </>
        )}

        {/* Denied visit */}
        {selectedType === 'visit_denied' && (
          <FormField label="Reason given (if any)">
            <StyledInput placeholder="What reason was provided?" value={reasonGiven} onChangeText={setReasonGiven} />
          </FormField>
        )}

        {/* Medical */}
        {selectedType === 'medical' && (
          <>
            <FormField label="Provider name">
              <StyledInput placeholder="Dr. Smith" value={body} onChangeText={setBody} />
            </FormField>
            <FormField label="Visit type">
              <ChipSelector
                options={['routine', 'urgent', 'emergency', 'dental', 'therapy'].map(v => ({ key: v, label: v }))}
                selected={transferMethod}
                onSelect={setTransferMethod}
              />
            </FormField>
          </>
        )}

        {/* Incident */}
        {selectedType === 'incident' && (
          <>
            <FormField label="Severity">
              <ChipSelector
                options={[
                  { key: 'low', label: 'Low' }, { key: 'medium', label: 'Medium' },
                  { key: 'high', label: 'High' }, { key: 'emergency', label: 'Emergency' },
                ]}
                selected={childMood}
                onSelect={setChildMood}
              />
            </FormField>
            <FormField label="Category">
              <ChipSelector
                options={['late', 'denied_visit', 'safety', 'verbal', 'substance', 'other'].map(c => ({ key: c, label: c.replace('_', ' ') }))}
                selected={expenseCategory}
                onSelect={setExpenseCategory}
              />
            </FormField>
          </>
        )}

        {/* Communication */}
        {selectedType === 'communication' && (
          <>
            <FormField label="Platform">
              <ChipSelector
                options={['ofw', 'text', 'email', 'whatsapp', 'phone'].map(p => ({ key: p, label: p.toUpperCase() }))}
                selected={transferMethod}
                onSelect={setTransferMethod}
              />
            </FormField>
            <FormField label="Direction">
              <ChipSelector
                options={[{ key: 'sent', label: 'Sent' }, { key: 'received', label: 'Received' }]}
                selected={expenseCategory}
                onSelect={setExpenseCategory}
              />
            </FormField>
          </>
        )}

        {/* Compliance */}
        {selectedType === 'compliance' && (
          <FormField label="Compliance notes">
            <StyledInput placeholder="Was the court order provision followed?" value={reasonGiven} onChangeText={setReasonGiven} multiline />
          </FormField>
        )}

        {/* Witness */}
        {selectedType === 'witness' && (
          <>
            <FormField label="Witness name">
              <StyledInput placeholder="Who witnessed this?" value={reasonGiven} onChangeText={setReasonGiven} />
            </FormField>
            <FormField label="What they observed">
              <StyledInput placeholder="Describe what the witness saw" value={statementContext} onChangeText={setStatementContext} multiline />
            </FormField>
          </>
        )}

        {/* Photo capture */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68' }}>Attachments</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={async () => {
                const photo = await takePhoto();
                if (photo) setPhotos([...photos, photo]);
              }}
              disabled={cameraLoading}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                backgroundColor: '#F0F0EA',
              }}
            >
              <Camera size={16} strokeWidth={1.75} color="#6B6A68" />
              <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68' }}>Camera</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                const photo = await pickFromGallery();
                if (photo) setPhotos([...photos, photo]);
              }}
              disabled={cameraLoading}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                backgroundColor: '#F0F0EA',
              }}
            >
              <ImageIcon size={16} strokeWidth={1.75} color="#6B6A68" />
              <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68' }}>Gallery</Text>
            </Pressable>
          </View>
          {photos.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {photos.map((p, i) => (
                <View key={i} style={{
                  width: 64, height: 64, borderRadius: 8, backgroundColor: '#F0F0EA',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
                }}>
                  <ImageIcon size={24} strokeWidth={1.5} color="#9A9893" />
                  <Text style={{ fontFamily: 'System', fontSize: 9, color: '#9A9893', marginTop: 2 }}>
                    {p.fileName.slice(0, 8)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

        {/* Child mood */}
        {(selectedType === 'journal' || selectedType === 'pickup_dropoff') && (
          <FormField label="Child's mood">
            <ChipSelector
              options={[
                { key: 'great', label: 'Great' },
                { key: 'good', label: 'Good' },
                { key: 'okay', label: 'Okay' },
                { key: 'upset', label: 'Upset' },
                { key: 'distressed', label: 'Distressed' },
              ]}
              selected={childMood}
              onSelect={setChildMood}
            />
          </FormField>
        )}

        {/* Location */}
        <FormField label="Location">
          <StyledInput placeholder="Where did this happen?" value={locationName} onChangeText={setLocationName} />
        </FormField>

        {/* Flag toggle */}
        <Pressable onPress={() => setIsFlagged(!isFlagged)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          <View style={{
            width: 22, height: 22, borderRadius: 6,
            borderWidth: 1.5,
            borderColor: isFlagged ? '#DC2626' : 'rgba(0,0,0,0.15)',
            backgroundColor: isFlagged ? '#DC2626' : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {isFlagged && <Check size={14} strokeWidth={2.5} color="#FFFFFF" />}
          </View>
          <Text style={{ fontFamily: 'System', fontSize: 15, color: '#1A1A18' }}>
            Flag as incident
          </Text>
        </Pressable>

        {/* Save button */}
        <Pressable
          onPress={onSave}
          style={{
            backgroundColor: '#1A1A18', height: 52, borderRadius: 12,
            alignItems: 'center', justifyContent: 'center', marginTop: 8,
          }}
          className="active:scale-[0.98]"
        >
          <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: '#FFFFFF' }}>
            Save entry
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
