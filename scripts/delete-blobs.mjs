// Vercel Blob の全画像を削除する
// 使い方: BLOB_READ_WRITE_TOKEN=xxxx node scripts/delete-blobs.mjs
import { list, del } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN が未設定です。');
  process.exit(1);
}

let cursor;
let total = 0;
do {
  const { blobs, cursor: next, hasMore } = await list({ token, cursor, limit: 1000 });
  if (blobs.length === 0) break;
  const urls = blobs.map((b) => b.url);
  // del は配列を受け付ける。大きすぎる場合に備えて 100 件ずつ
  for (let i = 0; i < urls.length; i += 100) {
    const chunk = urls.slice(i, i + 100);
    await del(chunk, { token });
    total += chunk.length;
    console.log(`  削除: ${total} 件`);
  }
  cursor = hasMore ? next : undefined;
} while (cursor);

console.log(`\n完了: ${total} 件を削除しました。`);
