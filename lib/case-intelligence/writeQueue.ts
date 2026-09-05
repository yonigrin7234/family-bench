// Each account has an independent queue. Failed writes reject their caller, but
// do not poison future retries. Older asynchronous writes can never finish last.
export function createWriteQueue() {
  const tails = new Map<string, Promise<unknown>>();
  return function enqueue<T>(key: string, write: () => Promise<T>): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(write);
    tails.set(key, next);
    const clean = () => { if (tails.get(key) === next) tails.delete(key); };
    next.then(clean, clean);
    return next;
  };
}
