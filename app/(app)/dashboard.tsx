import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, Clock, AlertTriangle, DollarSign, CheckCircle, Calendar } from 'lucide-react-native';

function StatCard({ icon: Icon, label, value, subtitle, color }: {
  icon: typeof BarChart3; label: string; value: string; subtitle?: string; color?: string;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68' }}>{label}</Text>
        <Icon size={16} strokeWidth={1.75} color="#9A9893" />
      </View>
      <Text style={{ fontFamily: 'Georgia', fontSize: 28, fontWeight: '600', color: color ?? '#1A1A18' }}>{value}</Text>
      {subtitle && <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893', marginTop: 4 }}>{subtitle}</Text>}
    </View>
  );
}

export default function DashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: '#1A1A18' }}>
          Dashboard
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {/* Stat cards row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={BarChart3} label="Total entries" value="0" subtitle="Start logging" />
          <StatCard icon={AlertTriangle} label="Flagged" value="0" color="#DC2626" />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={Clock} label="Late pickups" value="0" subtitle="avg 0 min" />
          <StatCard icon={DollarSign} label="Expenses" value="$0" color="#059669" />
        </View>

        {/* Compliance score */}
        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Georgia', fontSize: 18, fontWeight: '600', color: '#1A1A18' }}>Compliance</Text>
            <CheckCircle size={16} strokeWidth={1.75} color="#9A9893" />
          </View>
          <Text style={{ fontFamily: 'System', fontSize: 15, color: '#6B6A68', lineHeight: 22 }}>
            Add court order provisions in Settings to track compliance automatically.
          </Text>
        </View>

        {/* Upcoming deadlines */}
        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Georgia', fontSize: 18, fontWeight: '600', color: '#1A1A18' }}>Deadlines</Text>
            <Calendar size={16} strokeWidth={1.75} color="#9A9893" />
          </View>
          <Text style={{ fontFamily: 'System', fontSize: 15, color: '#6B6A68', lineHeight: 22 }}>
            Add your next hearing date in Settings to see countdown alerts here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
