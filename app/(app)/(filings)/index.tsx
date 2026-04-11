import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/shared/EmptyState';

export default function FilingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      <EmptyState
        title="Filings"
        description="Generate court-ready reports and declarations from your evidence. Add entries first, then come back here."
      />
    </SafeAreaView>
  );
}
