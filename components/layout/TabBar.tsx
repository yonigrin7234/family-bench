import { View, Text, Pressable } from 'react-native';
import { BookOpen, LayoutDashboard, Clock, FileText, MoreHorizontal } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  { key: 'journal', label: 'Journal', icon: BookOpen },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'timeline', label: 'Timeline', icon: Clock },
  { key: 'filings', label: 'Filings', icon: FileText },
  { key: 'more', label: 'More', icon: MoreHorizontal },
];

interface TabBarProps {
  activeTab: string;
  onTabPress: (key: string) => void;
}

// bg-transparent on cream page. NO colored background (anti-pattern #16).
// Icons 22px Lucide, 1.75px stroke. Active: text-accent. Inactive: text-muted.
// Labels: badge size (11px).
export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  return (
    <View className="flex-row items-center justify-around bg-transparent pb-2 pt-1 border-t-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            className="items-center justify-center py-1 px-3"
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Icon
              size={22}
              strokeWidth={1.75}
              color={isActive ? '#2563EB' : '#6B6A68'}
            />
            <Text
              className={`font-ui text-[11px] mt-0.5 ${
                isActive ? 'text-accent font-medium' : 'text-text-muted'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
