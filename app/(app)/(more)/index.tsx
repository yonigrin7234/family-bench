import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, FileText, MessageSquare, Search, User, ChevronRight } from 'lucide-react-native';
import { Separator } from '@/components/ui/Separator';

interface MenuItemProps {
  icon: typeof Settings;
  label: string;
  onPress?: () => void;
}

function MenuItem({ icon: Icon, label, onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 px-4 active:opacity-70"
    >
      <Icon size={20} strokeWidth={1.75} className="text-text-muted" />
      <Text className="font-ui text-[15px] text-text-primary dark:text-dark-text flex-1 ml-3">
        {label}
      </Text>
      <ChevronRight size={16} strokeWidth={1.75} className="text-text-muted" />
    </Pressable>
  );
}

export default function MoreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      <View className="px-4 py-4">
        <Text className="font-display text-[22px] font-semibold text-text-primary dark:text-dark-text">
          More
        </Text>
      </View>

      <ScrollView className="flex-1">
        <MenuItem icon={Search} label="Case research" />
        <Separator />
        <MenuItem icon={MessageSquare} label="Communications" />
        <Separator />
        <MenuItem icon={FileText} label="Court orders" />
        <Separator />
        <MenuItem icon={User} label="Case setup" />
        <Separator />
        <MenuItem icon={Settings} label="Settings" />
      </ScrollView>
    </SafeAreaView>
  );
}
