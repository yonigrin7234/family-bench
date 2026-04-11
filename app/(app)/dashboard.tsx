import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/shared/EmptyState';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      <EmptyState
        title="Dashboard"
        description="Start logging entries to see your compliance score, late pickup stats, expense totals, and custody time split."
      />
    </SafeAreaView>
  );
}
