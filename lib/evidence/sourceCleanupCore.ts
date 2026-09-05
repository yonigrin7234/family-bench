export type SourceCleanupState = { pendingCount: number; activeCount: number; working: boolean; error: string | null };
export type SourceCleanupPorts = {
  allowed: (uri: string) => boolean;
  readRegistry: () => Promise<string[]>;
  writeRegistry: (uris: string[]) => Promise<void>;
  removeFile: (uri: string) => Promise<void>;
};

/** Serial registry operations; active files are never candidates for background cleanup. */
export function createSourceCleanupQueue(ports: SourceCleanupPorts) {
  const known = new Set<string>(); const active = new Set<string>(); const listeners = new Set<() => void>();
  let loaded = false; let tail = Promise.resolve();
  let state: SourceCleanupState = { pendingCount: 0, activeCount: 0, working: false, error: null };
  function publish(patch: Partial<SourceCleanupState> = {}) {
    state = { ...state, ...patch, pendingCount: [...known].filter((uri) => !active.has(uri)).length, activeCount: active.size };
    listeners.forEach((listener) => listener());
  }
  async function load() {
    if (loaded) return;
    const values = await ports.readRegistry();
    if (!Array.isArray(values) || values.some((uri) => typeof uri !== 'string' || !ports.allowed(uri))) throw new Error('The temporary-file recovery registry could not be verified. It has not been overwritten.');
    values.forEach((uri) => known.add(uri)); loaded = true;
  }
  const persist = () => ports.writeRegistry([...known]);
  function enqueue(work: () => Promise<void>) {
    const next = tail.catch(() => undefined).then(async () => {
      publish({ working: true });
      try { await work(); publish({ error: null }); }
      catch (error) { publish({ error: error instanceof Error ? error.message : 'Temporary-file cleanup failed. Retry before leaving this device.' }); throw error; }
      finally { publish({ working: false }); }
    });
    tail = next.catch(() => undefined); return next;
  }
  async function discardKnown(uri: string) {
    active.delete(uri); known.add(uri); publish();
    let registryError: unknown;
    try { await load(); await persist(); } catch (error) { registryError = error; }
    try { await ports.removeFile(uri); known.delete(uri); }
    catch {
      throw new Error(registryError
        ? 'A temporary file could not be removed and its restart recovery record could not be saved. Retry cleanup before closing the app.'
        : 'A temporary app-cache file could not be removed. It is recorded for cleanup; retry before leaving this device.');
    }
    if (loaded) await persist();
    else if (registryError) throw registryError;
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    register(uri: string) {
      if (!ports.allowed(uri)) return Promise.resolve();
      // Synchronous protection also prevents a queued retry from racing a new consumer.
      active.add(uri); publish();
      return enqueue(async () => {
        try { await load(); known.add(uri); await persist(); }
        catch (error) {
          try { await discardKnown(uri); } catch (cleanupError) { throw cleanupError; }
          throw new Error(`The selected temporary file could not be registered safely and was discarded. ${error instanceof Error ? error.message : 'Retry selection after resolving device storage.'}`);
        }
      });
    },
    discard(uri: string) {
      if (!ports.allowed(uri)) return Promise.resolve();
      active.delete(uri); publish();
      return enqueue(() => discardKnown(uri));
    },
    retry() {
      return enqueue(async () => {
        await load();
        const failures: string[] = [];
        for (const uri of [...known]) {
          if (active.has(uri)) continue;
          try { await ports.removeFile(uri); known.delete(uri); }
          catch { failures.push(uri); }
        }
        await persist();
        if (failures.length) throw new Error(`${failures.length} temporary app-cache ${failures.length === 1 ? 'file still needs' : 'files still need'} cleanup. Retry before leaving this device.`);
      });
    },
  };
}
