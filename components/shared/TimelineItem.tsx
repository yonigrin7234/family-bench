import { View, Text } from 'react-native';

interface TimelineItemProps {
  date: string;
  title: string;
  description?: string;
  status?: 'completed' | 'active' | 'upcoming';
  isLast?: boolean;
}

export function TimelineItem({ date, title, description, status = 'upcoming', isLast }: TimelineItemProps) {
  const dotColor = status === 'completed' ? '#059669' : status === 'active' ? '#2563EB' : '#9A9893';

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* Timeline line + dot */}
      <View style={{ alignItems: 'center', width: 20 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor }} />
        {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 4 }} />}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
        <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893', marginBottom: 2 }}>{date}</Text>
        <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: '#1A1A18' }}>{title}</Text>
        {description && (
          <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68', marginTop: 4, lineHeight: 18 }}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}
