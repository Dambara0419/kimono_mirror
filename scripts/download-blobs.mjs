// Vercel Blob の全画像をローカルにコピーする
// 使い方: BLOB_READ_WRITE_TOKEN=xxxx node scripts/download-blobs.mjs [出力先ディレクトリ]
import { list } from '@vercel/blob';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN が未設定です。');
  process.exit(1);
}

const outDir = process.argv[2] || 'blob-backup';
await mkdir(outDir, { recursive: true });

let cursor;
let total = 0;
do {
  const { blobs, cursor: next, hasMore } = await list({ token, cursor, limit: 1000 });
  for (const b of blobs) {
    const res = await fetch(b.downloadUrl ?? b.url);
    if (!res.ok) {
      console.error(`  ✗ ${b.pathname} (HTTP ${res.status})`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    // pathname にスラッシュが含まれてもファイル名化
    const name = b.pathname.replaceAll('/', '_');
    await writeFile(join(outDir, name), buf);
    total++;
    console.log(`  ✓ ${name} (${buf.length} bytes)`);
  }
  cursor = hasMore ? next : undefined;
} while (cursor);

console.log(`\n完了: ${total} 件を ${outDir}/ に保存しました。`);
