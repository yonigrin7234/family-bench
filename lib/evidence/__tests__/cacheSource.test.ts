import test from 'node:test';
import assert from 'node:assert/strict';
import { isAppCacheSource } from '../cacheSource';

test('cleanup only accepts files within the app cache, never provider or gallery originals', () => {
  const cache = 'file:///app/Library/Caches/';
  assert.equal(isAppCacheSource('file:///app/Library/Caches/Audio/memo.m4a', cache), true);
  assert.equal(isAppCacheSource('file:///app/Library/Caches/DocumentPicker/my%20file.pdf', cache), true);
  for (const uri of [
    cache, `${cache}Audio/`, 'file:///app/Library/Caches-extra/file',
    'file:///app/Documents/file', 'file:///photos/gallery/original.jpg',
    'content://provider/file', 'ph://image', 'https://example.com/file',
    'file://another-host/app/Library/Caches/file', `${cache}../Documents/file`,
    `${cache}%2e%2e/Documents/file`, `${cache}%2e%2e%2fDocuments/file`,
    `${cache}Audio%00/memo`, `${cache}Audio%5c..%5cmemo`, `${cache}file?path=../`,
  ]) assert.equal(isAppCacheSource(uri, cache), false, uri);
});
