import { View, Text, Pressable } from 'react-native';
import { MoreHorizontal, MapPin, Users, AlertTriangle, Paperclip, Mic } from 'lucide-react-native';
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
  peoplePresent,
  metadata,
  onPress,
  onMorePress,
}: EntryCardProps) {
  const lateMinutes = metadata?.late_minutes as number | undefined;

  return (
    <Pressable
      className={`
        bg-surface dark:bg-dark-surface
        border border-border dark:border-dark-surface-hover
        rounded-card p-4 mb-2
        ${isFlagged ? 'border-l-[3px] border-l-danger' : ''}
        active:scale-[0.99]
      `}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${entryType} entry from ${formatDate(eventDate)}`}
    >
      {/* Header: badge + timestamp + overflow */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Badge type={entryType} />
          <Text className="font-ui text-[13px] text-text-muted dark:text-dark-text-muted">
            {formatDate(eventDate)}
            {eventTime ? ` ${formatTime(eventTime)}` : ''}
          </Text>
        </View>
        <Pressable
          onPress={onMorePress}
          className="w-8 h-8 items-center justify-center"
          hitSlop={8}
          accessibilityLabel="More options"
        >
          <MoreHorizontal size={20} strokeWidth={1.75} className="text-text-muted dark:text-dark-text-muted" />
        </Pressable>
      </View>

      {/* Late minutes callout for exchanges */}
      {lateMinutes != null && lateMinutes > 0 && (
        <View className="flex-row items-center gap-1.5 mb-2">
          <AlertTriangle size={14} strokeWidth={1.75} color="#DC2626" />
          <Text className="font-ui text-[13px] font-medium text-danger">
            {lateMinutes} minutes late
          </Text>
        </View>
      )}

      {/* Body text */}
      {(title || body) && (
        <Text
          className="font-ui text-[15px] text-text-primary dark:text-dark-text leading-relaxed mb-2"
          numberOfLines={3}
        >
          {title ?? body}
        </Text>
      )}

      {/* Metadata row */}
      <View className="flex-row items-center flex-wrap gap-4">
        {locationName && (
          <View className="flex-row items-center gap-1">
            <MapPin size={14} strokeWidth={1.75} className="text-text-muted dark:text-dark-text-muted" />
            <Text className="font-ui text-[13px] text-text-muted dark:text-dark-text-muted">
              {locationName}
            </Text>
          </View>
        )}
        {peoplePresent && peoplePresent.length > 0 && (
          <View className="flex-row items-center gap-1">
            <Users size={14} strokeWidth={1.75} className="text-text-muted dark:text-dark-text-muted" />
            <Text className="font-ui text-[13px] text-text-muted dark:text-dark-text-muted">
              {peoplePresent.length}
            </Text>
          </View>
        )}
        {hasAttachments && (
          <Paperclip size={14} strokeWidth={1.75} className="text-text-muted dark:text-dark-text-muted" />
        )}
        {hasAudio && (
          <Mic size={14} strokeWidth={1.75} className="text-text-muted dark:text-dark-text-muted" />
        )}
        {isFlagged && (
          <View className="flex-row items-center gap-1">
            <AlertTriangle size={14} strokeWidth={1.75} className="text-danger" />
            <Text className="font-ui text-[13px] text-danger">flagged</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
