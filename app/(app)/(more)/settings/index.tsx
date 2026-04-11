import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, FileText, Calendar, Bell, Shield, ChevronRight, LogOut } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
import { Separator } from '@/components/ui/Separator';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';

interface SettingsRowProps {
  icon: typeof User;
  label: string;
  value?: string;
  onPress?: () => void;
}

function SettingsRow({ icon: Icon, label, value, onPress }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 px-4 active:opacity-70"
    >
      <Icon size={20} strokeWidth={1.75} className="text-text-muted" />
      <Text className="font-ui text-[15px] text-text-primary dark:text-dark-text flex-1 ml-3">
        {label}
      </Text>
      {value && (
        <Text className="font-ui text-[14px] text-text-muted mr-2">{value}</Text>
      )}
      <ChevronRight size={16} strokeWidth={1.75} className="text-text-muted" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      <View className="h-11 flex-row items-center px-4">
        <IconButton icon={ArrowLeft} variant="transparent" onPress={() => router.back()} />
        <Text className="font-ui text-[16px] font-medium text-text-primary dark:text-dark-text ml-2">
          Settings
        </Text>
      </View>

      <ScrollView className="flex-1">
        <SettingsRow icon={User} label="Profile" onPress={() => {}} />
        <Separator />
        <SettingsRow icon={FileText} label="Case details" onPress={() => {}} />
        <Separator />
        <SettingsRow icon={FileText} label="Court orders" onPress={() => router.push('/(app)/(more)/settings/orders' as any)} />
        <Separator />
        <SettingsRow icon={Calendar} label="Key dates & deadlines" onPress={() => router.push('/(app)/(more)/settings/dates' as any)} />
        <Separator />
        <SettingsRow icon={Bell} label="Notifications" />
        <Separator />
        <SettingsRow icon={Shield} label="Security & privacy" />
        <Separator />

        <View className="px-4 pt-8">
          <Button
            variant="destructive"
            label="Sign out"
            icon={LogOut}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
