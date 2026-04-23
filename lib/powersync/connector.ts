import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/common';
import { supabase } from '@/lib/supabase/client';

// Maps PowerSync tables to Supabase tables for CRUD operations
export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
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
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        const table = op.table;
        const record = { ...op.opData, id: op.id };

        switch (op.op) {
          case UpdateType.PUT: {
            const { error } = await supabase.from(table).upsert(record as Record<string, unknown>);
            if (error) throw error;
            break;
          }
          case UpdateType.PATCH: {
            const { error } = await supabase
              .from(table)
              .update(op.opData ?? {})
              .eq('id', op.id);
            if (error) throw error;
            break;
          }
          case UpdateType.DELETE: {
            // Soft delete for entries, case_documents, filing_packages
            if (['entries', 'case_documents', 'filing_packages'].includes(table)) {
              const { error } = await supabase
                .from(table)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', op.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
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
