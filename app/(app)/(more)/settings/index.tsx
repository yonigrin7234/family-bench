import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings, FileText, Calendar, Bell, Shield, User, ChevronRight, LogOut, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';

function SettingsRow({ icon: Icon, label, value, onPress }: {
  icon: typeof Settings; label: string; value?: string; onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="active:opacity-70"
    >
      <Icon size={20} strokeWidth={1.75} color="#6B6A68" />
      <Text style={{ fontFamily: 'System', fontSize: 15, color: '#1A1A18', flex: 1, marginLeft: 12 }}>
        {label}
      </Text>
      {value && <Text style={{ fontFamily: 'System', fontSize: 14, color: '#9A9893', marginRight: 8 }}>{value}</Text>}
      <ChevronRight size={16} strokeWidth={1.75} color="#9A9893" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 }}>
          <ArrowLeft size={20} strokeWidth={1.75} color="#1A1A18" />
        </Pressable>
        <Text style={{ fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: '#1A1A18', marginLeft: 12 }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 12,
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
        }}>
          <SettingsRow icon={User} label="Profile" />
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16 }} />
          <SettingsRow icon={FileText} label="Case details" />
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16 }} />
          <SettingsRow icon={FileText} label="Court orders" onPress={() => router.push('/(app)/(more)/settings/orders' as any)} />
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16 }} />
          <SettingsRow icon={Calendar} label="Key dates" onPress={() => router.push('/(app)/(more)/settings/dates' as any)} />
        </View>

        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 12,
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
        }}>
          <SettingsRow icon={Bell} label="Notifications" />
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16 }} />
          <SettingsRow icon={Shield} label="Security & privacy" />
        </View>

        {/* Sign out */}
        <Pressable
          onPress={async () => { await supabase.auth.signOut(); router.replace('/(auth)/login'); }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 24 }}
          className="active:opacity-70"
        >
          <LogOut size={18} strokeWidth={1.75} color="#DC2626" />
          <Text style={{ fontFamily: 'System', fontSize: 15, color: '#DC2626', marginLeft: 8 }}>
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
