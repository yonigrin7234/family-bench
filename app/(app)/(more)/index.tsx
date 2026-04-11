import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings, FileText, MessageSquare, Search, User, ChevronRight } from 'lucide-react-native';

function MenuItem({ icon: Icon, label, onPress }: { icon: typeof Settings; label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16,
      }}
      className="active:opacity-70"
    >
      <Icon size={20} strokeWidth={1.75} color="#6B6A68" />
      <Text style={{ fontFamily: 'System', fontSize: 15, color: '#1A1A18', flex: 1, marginLeft: 12 }}>
        {label}
      </Text>
      <ChevronRight size={16} strokeWidth={1.75} color="#9A9893" />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: '#1A1A18' }}>
          More
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 12, marginHorizontal: 16, marginBottom: 12,
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
        }}>
          <MenuItem icon={Search} label="Case research" />
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16 }} />
          <MenuItem icon={MessageSquare} label="Communications" />
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16 }} />
          <MenuItem icon={FileText} label="Court orders" onPress={() => router.push('/(app)/(more)/settings/orders' as any)} />
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16 }} />
          <MenuItem icon={User} label="Case setup" />
        </View>

        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 12, marginHorizontal: 16,
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
        }}>
          <MenuItem icon={Settings} label="Settings" onPress={() => router.push('/(app)/(more)/settings' as any)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
