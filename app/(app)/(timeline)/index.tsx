import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/shared/EmptyState';

export default function TimelineScreen() {
  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      <EmptyState
        title="Timeline"
        description="A calendar view of your evidence will appear here once you start logging entries."
      />
    </SafeAreaView>
  );
}
