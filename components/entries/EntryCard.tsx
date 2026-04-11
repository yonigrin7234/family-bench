import { View, Text, Pressable } from 'react-native';
import { MoreHorizontal, MapPin, Paperclip, AlertTriangle, Mic } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import type { entryBadgeColors } from '@/constants/theme';

type EntryType = keyof typeof entryBadgeColors;

interface EntryCardProps {
  id: string;
  entryType: EntryType;
  title?: string;
  body?: string;
  eventDate: string;
  eventTime?: string;
  locationName?: string;
  isFlagged?: boolean;
  flagSeverity?: string;
  hasAttachments?: boolean;
  hasAudio?: boolean;
  peoplePresent?: string[];
  metadata?: Record<string, unknown>;
  onPress?: () => void;
  onMorePress?: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function EntryCard({
  entryType,
  title,
  body,
  eventDate,
  eventTime,
  locationName,
  isFlagged,
  hasAttachments,
  hasAudio,
  metadata,
  onPress,
  onMorePress,
}: EntryCardProps) {
  const lateMinutes = metadata?.late_minutes as number | undefined;

  return (
    <Pressable
      onPress={onPress}
      className="active:scale-[0.99]"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderLeftWidth: isFlagged ? 3 : 1,
        borderLeftColor: isFlagged ? '#DC2626' : 'rgba(0,0,0,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }}
      accessibilityRole="button"
    >
      {/* Top row: badge + timestamp + overflow */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Badge type={entryType} />
          <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893' }}>
            {formatDate(eventDate)}
            {eventTime ? ` ${formatTime(eventTime)}` : ''}
          </Text>
        </View>
        <Pressable onPress={onMorePress} hitSlop={8} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <MoreHorizontal size={20} strokeWidth={1.75} color="#9A9893" />
        </Pressable>
      </View>

      {/* Late minutes callout */}
      {lateMinutes != null && lateMinutes > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <AlertTriangle size={14} strokeWidth={1.75} color="#DC2626" />
          <Text style={{ fontFamily: 'System', fontSize: 13, fontWeight: '500', color: '#DC2626' }}>
            {lateMinutes} minutes late
          </Text>
        </View>
      )}

      {/* Body text */}
      {(title || body) && (
        <Text
          numberOfLines={3}
          style={{
            fontFamily: 'System',
            fontSize: 15,
            color: '#1A1A18',
            lineHeight: 22,
            marginTop: 8,
          }}
        >
          {title ?? body}
        </Text>
      )}

      {/* Bottom metadata row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
        {locationName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={14} strokeWidth={1.75} color="#9A9893" />
            <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893' }}>
              {locationName}
            </Text>
          </View>
        )}
        {hasAttachments && <Paperclip size={14} strokeWidth={1.75} color="#9A9893" />}
        {hasAudio && <Mic size={14} strokeWidth={1.75} color="#9A9893" />}
        {isFlagged && <AlertTriangle size={14} strokeWidth={1.75} color="#DC2626" />}
      </View>
    </Pressable>
  );
}
