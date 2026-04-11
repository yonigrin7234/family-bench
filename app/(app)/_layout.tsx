import { Tabs } from 'expo-router';
import { BookOpen, LayoutDashboard, Clock, FileText, MoreHorizontal } from 'lucide-react-native';
import { Platform } from 'react-native';

// 5-tab layout matching the design system.
// Tab bar: transparent bg, no border, Lucide icons 22px.
// Active: accent blue. Inactive: muted gray.
export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B6A68',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'web' ? '#F5F5F0' : 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          position: Platform.OS === 'ios' ? 'absolute' : 'relative',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="(journal)"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => (
            <BookOpen size={22} strokeWidth={1.75} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={22} strokeWidth={1.75} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(timeline)"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }) => (
            <Clock size={22} strokeWidth={1.75} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(filings)"
        options={{
          title: 'Filings',
          tabBarIcon: ({ color }) => (
            <FileText size={22} strokeWidth={1.75} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <MoreHorizontal size={22} strokeWidth={1.75} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
