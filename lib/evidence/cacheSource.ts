/** Restrict cleanup to an individual file inside Expo's own cache directory. */
export function isAppCacheSource(sourceUri: string, cacheDirectory: string): boolean {
  try {
    const source = new URL(sourceUri);
    const cache = new URL(cacheDirectory);
    if (source.protocol !== 'file:' || cache.protocol !== 'file:' || source.host !== cache.host || source.search || source.hash) return false;
    const sourcePath = decodeURIComponent(source.pathname);
    const decodedCache = decodeURIComponent(cache.pathname);
    const cachePath = decodedCache.endsWith('/') ? decodedCache : `${decodedCache}/`;
    if (sourcePath.includes('\0') || sourcePath.includes('\\') || sourcePath.split('/').includes('..')) return false;
    return sourcePath.startsWith(cachePath) && sourcePath !== cachePath && !sourcePath.endsWith('/');
  } catch { return false; }
}
