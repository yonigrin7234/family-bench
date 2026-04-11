import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/shared/EmptyState';

export default function TimelineScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: '#1A1A18' }}>
          Timeline
        </Text>
      </View>
      <EmptyState
        title="Timeline coming soon"
        description="A calendar view of your evidence will appear here once you start logging entries."
      />
    </SafeAreaView>
  );
}
