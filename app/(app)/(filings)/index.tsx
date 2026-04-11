import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/shared/EmptyState';

export default function FilingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: '#1A1A18' }}>
          Filings
        </Text>
      </View>
      <EmptyState
        title="No filings yet"
        description="Generate court-ready reports and declarations from your evidence. Add entries first, then come back here."
      />
    </SafeAreaView>
  );
}
