import { View } from 'react-native';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { useResponsive } from '@/lib/hooks/useResponsive';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  activeTab: string;
  onTabPress: (key: string) => void;
  onNewEntry?: () => void;
  userName?: string;
  userInitials?: string;
  bottomBar?: ReactNode; // QuickEntryBar goes here
}

// Responsive: bottom tabs on mobile, sidebar on desktop
export function AppShell({
  children,
  activeTab,
  onTabPress,
  onNewEntry,
  userName,
  userInitials,
  bottomBar,
}: AppShellProps) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <View className="flex-1 bg-page dark:bg-dark-page">
        <View className="flex-1">{children}</View>
        {bottomBar}
        <TabBar activeTab={activeTab} onTabPress={onTabPress} />
      </View>
    );
  }

  // Desktop/tablet: sidebar layout
  return (
    <View className="flex-1 flex-row bg-page dark:bg-dark-page">
      <Sidebar
        activeTab={activeTab}
        onTabPress={onTabPress}
        onNewEntry={onNewEntry}
        userName={userName}
        userInitials={userInitials}
      />
      <View className="flex-1">{children}</View>
    </View>
  );
}
