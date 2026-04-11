import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Pencil, Trash2, AlertTriangle, MapPin, Users, Clock } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { hapticWarning } from '@/lib/utils/haptics';
import { useEntriesStore } from '@/stores/entries';
import { entryTypeLabels } from '@/constants/theme';

function formatDateTime(date: string, time?: string): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'System', fontSize: 15, color: '#6B6A68' }}>Entry not found</Text>
      </SafeAreaView>
    );
  }

  const lateMinutes = entry.metadata?.late_minutes as number | undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 }}
        >
          <ArrowLeft size={20} strokeWidth={1.75} color="#1A1A18" />
        </Pressable>
        <Badge type={entry.entry_type as any} />
        <Pressable
          onPress={() => {}}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 }}
        >
          <Pencil size={20} strokeWidth={1.75} color="#1A1A18" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* Title + date */}
        <Text style={{ fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: '#1A1A18' }}>
          {entryTypeLabels[entry.entry_type] ?? entry.entry_type}
        </Text>
        <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893' }}>
          {formatDateTime(entry.event_date, entry.event_time)}
        </Text>

        {/* Late callout */}
        {lateMinutes != null && lateMinutes > 0 && (
          <View style={{
            backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
            flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={18} strokeWidth={1.75} color="#DC2626" />
            <Text style={{ fontFamily: 'System', fontSize: 14, fontWeight: '500', color: '#DC2626' }}>
              {lateMinutes} minutes late
            </Text>
          </View>
        )}

        {/* Custody period */}
        {entry.custody_period && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Clock size={16} strokeWidth={1.75} color="#9A9893" />
            <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893' }}>
              {entry.custody_period === 'my_time' ? 'My custody time' :
               entry.custody_period === 'their_time' ? "Other parent's time" : 'Transition'}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

        {/* Body */}
        {entry.body && (
          <Text style={{ fontFamily: 'System', fontSize: 15, color: '#1A1A18', lineHeight: 22 }}>
            {entry.body}
          </Text>
        )}

        {/* Voice side-by-side reveal */}
        {entry.voice_transcript && (
          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: '#F5F5F0', borderRadius: 12, padding: 12 }}>
              <Text style={{ fontFamily: 'System', fontSize: 12, fontWeight: '500', color: '#78766F', marginBottom: 4 }}>
                What you said
              </Text>
              <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893', lineHeight: 20 }}>
                {entry.voice_transcript}
              </Text>
            </View>
            <View style={{
              backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
              borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
            }}>
              <Text style={{ fontFamily: 'System', fontSize: 12, fontWeight: '500', color: '#2563EB', marginBottom: 4 }}>
                Structured as evidence
              </Text>
              <Text style={{ fontFamily: 'System', fontSize: 15, color: '#1A1A18', lineHeight: 22 }}>
                {entry.body}
              </Text>
            </View>
          </View>
        )}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

        {/* Metadata */}
        <View style={{ gap: 12 }}>
          {entry.location_name && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} strokeWidth={1.75} color="#9A9893" />
              <Text style={{ fontFamily: 'System', fontSize: 14, color: '#6B6A68' }}>{entry.location_name}</Text>
            </View>
          )}
          {entry.people_present && entry.people_present.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users size={16} strokeWidth={1.75} color="#9A9893" />
              <Text style={{ fontFamily: 'System', fontSize: 14, color: '#6B6A68' }}>{entry.people_present.join(', ')}</Text>
            </View>
          )}
          {entry.child_mood && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893' }}>Mood:</Text>
              <Text style={{ fontFamily: 'System', fontSize: 14, color: '#1A1A18' }}>{entry.child_mood}</Text>
            </View>
          )}
        </View>

        {/* Flagged */}
        {entry.is_flagged && (
          <>
            <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <View style={{
              backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={16} strokeWidth={1.75} color="#DC2626" />
              <Text style={{ fontFamily: 'System', fontSize: 14, fontWeight: '500', color: '#DC2626' }}>
                Flagged: {entry.flag_category} ({entry.flag_severity})
              </Text>
            </View>
          </>
        )}

        {/* Delete */}
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginTop: 16 }} />
        <Pressable
          onPress={() => { hapticWarning(); softDeleteEntry(entry.id); router.back(); }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Delete entry"
          className="active:opacity-70"
        >
          <Trash2 size={18} strokeWidth={1.75} color="#DC2626" />
          <Text style={{ fontFamily: 'System', fontSize: 15, color: '#DC2626', marginLeft: 8 }}>
            Delete entry
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
