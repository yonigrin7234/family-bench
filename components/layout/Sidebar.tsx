import { View, Text, Pressable } from 'react-native';
import { BookOpen, LayoutDashboard, Clock, FileText, MoreHorizontal, Menu, Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';

interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { key: 'journal', label: 'Journal', icon: BookOpen },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'timeline', label: 'Timeline', icon: Clock },
  { key: 'filings', label: 'Filings', icon: FileText },
  { key: 'more', label: 'More', icon: MoreHorizontal },
];

interface SidebarProps {
  activeTab: string;
  onTabPress: (key: string) => void;
  onNewEntry?: () => void;
  userName?: string;
  userInitials?: string;
}

// Collapsed: w-12, icons only, bg-page (seamless)
// Expanded: w-60, icons + labels, serif "Family Bench" heading
export function Sidebar({ activeTab, onTabPress, onNewEntry, userName, userInitials }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View className={`${expanded ? 'w-60' : 'w-12'} bg-page dark:bg-dark-page h-full py-4`}>
      {/* Toggle + Brand */}
      <View className={`flex-row items-center ${expanded ? 'px-3 mb-6' : 'justify-center mb-4'}`}>
        <Pressable
          onPress={() => setExpanded(!expanded)}
          className="w-8 h-8 items-center justify-center"
          accessibilityLabel={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu size={20} strokeWidth={1.75} className="text-text-muted dark:text-dark-text-muted" />
        </Pressable>
        {expanded && (
          <Text className="font-display text-[18px] font-semibold text-text-primary dark:text-dark-text ml-2">
            Family Bench
          </Text>
        )}
      </View>

      {/* New entry button */}
      <View className={`${expanded ? 'px-3' : 'items-center'} mb-4`}>
        <Pressable
          onPress={onNewEntry}
          className={`
            bg-accent rounded-full items-center justify-center active:scale-[0.98]
            ${expanded ? 'flex-row gap-2 px-4 py-2.5' : 'w-9 h-9'}
          `}
          accessibilityLabel="New entry"
        >
          <Plus size={18} strokeWidth={2} color="#FFFFFF" />
          {expanded && (
            <Text className="font-ui text-[14px] font-medium text-white">
              New entry
            </Text>
          )}
        </Pressable>
      </View>

      {/* Nav items */}
      <View className="flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onTabPress(item.key)}
              className={`
                flex-row items-center gap-3 py-3
                ${expanded ? 'px-3 mx-2 rounded-lg' : 'justify-center'}
                ${isActive ? 'bg-accent-lighter dark:bg-dark-surface' : ''}
                active:opacity-70
              `}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.label}
            >
              <Icon
                size={20}
                strokeWidth={1.75}
                color={isActive ? '#2563EB' : '#6B6A68'}
              />
              {expanded && (
                <Text
                  className={`font-ui text-[15px] ${
                    isActive ? 'text-accent font-medium' : 'text-text-muted dark:text-dark-text-muted'
                  }`}
                >
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* User avatar at bottom */}
      <View className={`${expanded ? 'px-3 flex-row items-center gap-3' : 'items-center'} pt-4`}>
        <View className="w-8 h-8 rounded-full bg-accent-light items-center justify-center">
          <Text className="font-ui text-[12px] font-medium text-accent">
            {userInitials ?? 'U'}
          </Text>
        </View>
        {expanded && userName && (
          <View>
            <Text className="font-ui text-[14px] text-text-primary dark:text-dark-text">
              {userName}
            </Text>
            <Text className="font-ui text-[12px] text-text-muted dark:text-dark-text-muted">
              Pro plan
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
