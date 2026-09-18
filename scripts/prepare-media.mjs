import { mkdir, readFile, writeFile, copyFile, readdir, stat, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { scanMedia, mediaType } from './media-utils.mjs';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'public/media');
const config = JSON.parse(await readFile(path.join(root, 'src/data/media.config.json'), 'utf8'));
await mkdir(output, { recursive: true });
const items = [];
const generated = new Set();
for (const source of await scanMedia(path.join(root, 'gallery'))) {
  if (config.exclude.includes(source)) continue;
  const country = source.split('/')[0];
  if (!['DE', 'HU'].includes(country)) continue;
  const absolute = path.join(root, 'gallery', source);
  const bytes = await readFile(absolute);
  const id = createHash('sha256').update(source).update(bytes).digest('hex').slice(0, 16);
  const type = mediaType(source);
  const title = config.captions[source] || `Einblick ${items.filter(i => i.country === country).length + 1} – ${country === 'DE' ? 'Deutschland' : 'Ungarn'}`;
  if (type === 'video') {
    const filename = `${id}${path.extname(source).toLowerCase()}`;
    await copyFile(absolute, path.join(output, filename));
    generated.add(filename);
    items.push({ id, source, country, title, type, full: `media/${filename}`, thumb: null });
    continue;
  }
  const metadata = await sharp(bytes).metadata();
  const swapped = [5, 6, 7, 8].includes(metadata.orientation);
  const width = swapped ? metadata.height : metadata.width;
  const height = swapped ? metadata.width : metadata.height;
  const variants = [['thumb', 640, 78], ['large', 1600, 85], ['full', null, 94]];
  const urls = {};
  for (const [variant, size, quality] of variants) {
    const filename = `${id}-${variant}.${variant === 'full' ? 'jpg' : 'webp'}`;
    generated.add(filename);
    const destination = path.join(output, filename);
    urls[variant] = `media/${filename}`;
    if (await stat(destination).catch(() => null)) continue;
    let image = sharp(bytes).rotate();
    if (size) image = image.resize({ width: size, withoutEnlargement: true });
    // No metadata is carried over. Full pixel dimensions are retained for the viewer.
    await (variant === 'full' ? image.jpeg({ quality }) : image.webp({ quality })).toFile(destination);
  }
  items.push({ id, source, country, title, type, width, height, ...urls });
}
// Only generated hash-named assets in this dedicated output directory are pruned.
for (const entry of await readdir(output)) {
  if (/^[a-f0-9]{16}(?:-(?:thumb|large|full))?\.(jpg|webp|mp4|webm)$/.test(entry) && !generated.has(entry)) {
    await unlink(path.join(output, entry));
  }
}
await mkdir(path.join(root, 'src/data'), { recursive: true });
await writeFile(path.join(root, 'src/data/media.generated.json'), JSON.stringify(items, null, 2) + '\n');
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(items));
await mkdir(path.join(root, 'public/brand'), { recursive: true });
const logo = await readFile(path.join(root, 'assets/smiling-relations_outlined.svg'), 'utf8');
await writeFile(path.join(root, 'public/brand/logo.svg'), logo.replaceAll('#ed6320', '#a80d2b'));
await sharp(path.join(root, 'assets/Buch01.jpg')).rotate().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(root, 'public/brand/buch.webp'));
await sharp(path.join(root, 'assets/zeitungsartikel.jpg')).rotate().jpeg({ quality: 95 }).toFile(path.join(root, 'public/brand/presse.jpg'));
await sharp(path.join(root, 'assets/zeitungsartikel.jpg')).rotate().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(root, 'public/brand/presse-preview.webp'));
for (const name of ['betriebswirtin-hwk', 'open4life-coach']) {
  // Preserve the supplied certificates exactly; generate only a small preview.
  await copyFile(path.join(root, `assets/${name}.jpg`), path.join(root, `public/brand/${name}.jpg`));
  await sharp(path.join(root, `assets/${name}.jpg`)).rotate().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(root, `public/brand/${name}-preview.webp`));
}
await mkdir(path.join(root, 'public/fonts'), { recursive: true });
for (const file of await readdir(path.join(root, 'fonts'))) {
  if (file.endsWith('.woff2')) await copyFile(path.join(root, 'fonts', file), path.join(root, 'public/fonts', file));
}
console.log(`Prepared ${items.length} media items; nomedia, archives and excluded images omitted.`);
