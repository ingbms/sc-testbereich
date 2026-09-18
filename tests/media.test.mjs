import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { mediaType, scanMedia } from '../scripts/media-utils.mjs';

test('media scanner excludes nomedia recursively, archives and unsupported files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'sr-media-'));
  try {
    for (const folder of ['DE', 'HU/nomedia', 'HU/event/NOMEDIA']) await mkdir(path.join(root, folder), { recursive: true });
    for (const name of ['DE/photo.JPG', 'HU/clip.mp4', 'HU/archive.zip', 'HU/note.txt', 'HU/nomedia/private.jpg', 'HU/event/NOMEDIA/private.mp4']) await writeFile(path.join(root, name), 'fixture');
    assert.deepEqual(await scanMedia(root), ['DE/photo.JPG', 'HU/clip.mp4']);
    assert.equal(mediaType('a/nomedia/x.jpg'), null);
    assert.equal(mediaType('movie.mov'), null);
  } finally {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('sr-media-'));
    await rm(root, { recursive: true, force: true });
  }
});
