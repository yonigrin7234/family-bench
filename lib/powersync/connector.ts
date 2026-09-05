import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/common';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

type SupabaseUploadClient = {
  from: (table: string) => {
    upsert: (record: Record<string, unknown>) => { error: unknown } | Promise<{ error: unknown }>;
    update: (record: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
  };
};

function getSupabaseUploadClient(): SupabaseUploadClient {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is disabled. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before syncing.');
  }

  return supabase as unknown as SupabaseUploadClient;
}

const SYNC_TABLES = new Set([
  'profiles',
  'cases',
  'children',
  'people',
  'entries',
  'attachments',
  'court_orders',
  'court_order_provisions',
  'compliance_checks',
  'entry_children',
  'entry_people',
  'entry_court_order_provisions',
  'filing_packages',
  'filing_package_entries',
  'filing_package_attachments',
  'key_dates',
  'pattern_tags',
  'advisor_threads',
  'ai_outputs',
  'ai_output_sources',
  'reports',
]);

const SOFT_DELETE_TABLES = new Set([
  'cases',
  'children',
  'people',
  'entries',
  'attachments',
  'court_orders',
  'court_order_provisions',
  'filing_packages',
  'key_dates',
  'pattern_tags',
  'advisor_threads',
  'ai_outputs',
]);

// Maps PowerSync tables to Supabase tables for CRUD operations.
export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured — set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No active session — user must sign in');
    }

    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL!,
      token: session.access_token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const uploadClient = getSupabaseUploadClient();
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        const table = op.table;
        if (!SYNC_TABLES.has(table)) {
          throw new Error(`PowerSync upload attempted for unsupported table: ${table}`);
        }

        const record = { ...op.opData, id: op.id };

        switch (op.op) {
          case UpdateType.PUT: {
            const { error } = await uploadClient.from(table).upsert(record as Record<string, unknown>);
            if (error) throw error;
            break;
          }
          case UpdateType.PATCH: {
            const { error } = await uploadClient
              .from(table)
              .update(op.opData ?? {})
              .eq('id', op.id);
            if (error) throw error;
            break;
          }
          case UpdateType.DELETE: {
            if (SOFT_DELETE_TABLES.has(table)) {
              const { error } = await uploadClient
                .from(table)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', op.id);
              if (error) throw error;
            } else {
              const { error } = await uploadClient
                .from(table)
                .delete()
                .eq('id', op.id);
              if (error) throw error;
            }
            break;
          }
        }
      }

      await transaction.complete();
    } catch (error) {
      console.error('PowerSync upload error:', error);
      throw error;
    }
  }
}
