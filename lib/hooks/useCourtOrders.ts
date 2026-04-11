import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface CourtOrder {
  id: string;
  order_title: string;
  order_date: string;
  order_type: string;
  provisions: Array<{ id: string; text: string; category: string }>;
}

export function useCourtOrders() {
  const [orders, setOrders] = useState<CourtOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('court_orders')
        .select('*')
        .is('deleted_at', null)
        .order('order_date', { ascending: false });
      if (error) throw error;
      setOrders((data as CourtOrder[]) ?? []);
    } catch (e) {
      console.error('Failed to fetch court orders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrder = useCallback(async (order: Omit<CourtOrder, 'id'>) => {
    const newOrder = { ...order, id: crypto.randomUUID() };
    setOrders((prev) => [newOrder, ...prev]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('court_orders').insert({
        id: newOrder.id,
        user_id: user?.id,
        order_title: newOrder.order_title,
        order_date: newOrder.order_date,
        order_type: newOrder.order_type ?? 'custody',
        provisions: newOrder.provisions,
      });
    } catch (e) {
      console.error('Failed to save court order:', e);
    }

    return newOrder;
  }, []);

  return { orders, loading, fetchOrders, addOrder };
}
