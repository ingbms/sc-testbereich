import { readdir } from 'node:fs/promises';
import path from 'node:path';

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const videoExtensions = new Set(['.mp4', '.webm']);
export function mediaType(filename) {
  if (filename.split(/[\\/]/).some(part => part.toLowerCase() === 'nomedia')) return null;
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.has(ext) ? 'image' : videoExtensions.has(ext) ? 'video' : null;
}
export async function scanMedia(root, relative = '') {
  const found = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    if (entry.name.toLowerCase() === 'nomedia' || entry.isSymbolicLink()) continue;
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) found.push(...await scanMedia(root, name));
    else if (entry.isFile() && mediaType(name)) found.push(name);
  }
  return found.sort((a, b) => a.localeCompare(b, 'de'));
}
