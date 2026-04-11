import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, ChevronRight, CheckCircle, XCircle } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Separator } from '@/components/ui/Separator';
import { useState } from 'react';

interface Provision {
  id: string;
  text: string;
  category: string;
}

interface CourtOrder {
  id: string;
  title: string;
  orderDate: string;
  provisions: Provision[];
}

export default function CourtOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<CourtOrder[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newProvisions, setNewProvisions] = useState('');

  const addOrder = () => {
    if (!newTitle.trim()) return;

    const provisions = newProvisions
      .split('\n')
      .filter((line) => line.trim())
      .map((text, i) => ({
        id: `p${i}-${Date.now()}`,
        text: text.trim(),
        category: 'general',
      }));

    setOrders([
      ...orders,
      {
        id: crypto.randomUUID(),
        title: newTitle,
        orderDate: newDate || new Date().toISOString().split('T')[0],
        provisions,
      },
    ]);
    setNewTitle('');
    setNewDate('');
    setNewProvisions('');
    setAdding(false);

    // TODO: persist to Supabase court_orders table
  };

  if (adding) {
    return (
      <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
        <View className="h-11 flex-row items-center justify-between px-4">
          <IconButton icon={ArrowLeft} variant="transparent" onPress={() => setAdding(false)} />
          <Text className="font-ui text-[16px] font-medium text-text-primary dark:text-dark-text">
            Add court order
          </Text>
          <View className="w-11" />
        </View>

        <View className="flex-1 px-4 pt-4 gap-4">
          <Input
            label="Order title"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="e.g. Custody Order, Restraining Order"
          />
          <Input
            label="Order date"
            value={newDate}
            onChangeText={setNewDate}
            placeholder="YYYY-MM-DD"
          />
          <TextArea
            label="Provisions (one per line)"
            value={newProvisions}
            onChangeText={setNewProvisions}
            placeholder={"Father has custody every other weekend\nMother shall not disparage father\nBoth parents share medical expenses 50/50\nNeither parent shall use substances around child"}
          />
          <Button variant="accent" label="Save order" onPress={addOrder} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      <View className="h-11 flex-row items-center justify-between px-4">
        <IconButton icon={ArrowLeft} variant="transparent" onPress={() => router.back()} />
        <Text className="font-ui text-[16px] font-medium text-text-primary dark:text-dark-text">
          Court orders
        </Text>
        <IconButton icon={Plus} variant="surface" onPress={() => setAdding(true)} />
      </View>

      {orders.length === 0 ? (
        <EmptyState
          title="No court orders yet"
          description="Add your custody order provisions so the app can track compliance automatically."
          actionLabel="Add court order"
          actionIcon={Plus}
          onAction={() => setAdding(true)}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <Card>
              <Text className="font-display text-[18px] font-semibold text-text-primary dark:text-dark-text mb-1">
                {item.title}
              </Text>
              <Text className="font-ui text-[13px] text-text-muted mb-3">
                {item.orderDate}
              </Text>
              {item.provisions.map((p) => (
                <View key={p.id} className="flex-row items-start gap-2 py-1.5">
                  <CheckCircle size={16} strokeWidth={1.75} className="text-text-muted mt-0.5" />
                  <Text className="font-ui text-[14px] text-text-primary dark:text-dark-text flex-1">
                    {p.text}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}
