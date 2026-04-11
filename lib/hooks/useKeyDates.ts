import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { scheduleDeadlineReminder } from '@/lib/utils/notifications';

export interface KeyDate {
  id: string;
  title: string;
  event_date: string;
  date_type: string;
  description?: string;
  is_completed: boolean;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function useKeyDates() {
  const [dates, setDates] = useState<(KeyDate & { daysRemaining: number })[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('key_dates')
        .select('*')
        .is('deleted_at', null)
        .order('event_date', { ascending: true });
      if (error) throw error;
      setDates(
        ((data as KeyDate[]) ?? []).map((d) => ({
          ...d,
          daysRemaining: daysUntil(d.event_date),
        }))
      );
    } catch (e) {
      console.error('Failed to fetch key dates:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addDate = useCallback(async (date: Omit<KeyDate, 'id' | 'is_completed'>) => {
    const newDate = { ...date, id: crypto.randomUUID(), is_completed: false };
    setDates((prev) =>
      [...prev, { ...newDate, daysRemaining: daysUntil(newDate.event_date) }]
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
    );

    // Persist to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('key_dates').insert({
        id: newDate.id,
        user_id: user?.id,
        title: newDate.title,
        event_date: newDate.event_date,
        date_type: newDate.date_type,
        description: newDate.description,
        is_completed: false,
      });
    } catch (e) {
      console.error('Failed to save key date:', e);
    }

    // Schedule push notification reminders
    try {
      await scheduleDeadlineReminder({
        title: newDate.title,
        body: `${newDate.date_type}: ${newDate.title}`,
        deadlineDate: newDate.event_date,
        reminderDaysBefore: [7, 3, 1],
      });
    } catch (e) {
      console.error('Failed to schedule reminder:', e);
    }

    return newDate;
  }, []);

  return { dates, loading, fetchDates, addDate };
}
