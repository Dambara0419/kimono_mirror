import { list, del } from '@vercel/blob';

// アップロードから3日（72時間）経過した画像を削除する。
// Vercel Cron から1日1回呼ばれる想定（vercel.json の crons 設定）。
const RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  // Vercel Cron は CRON_SECRET を Bearer トークンとして送る。設定時は検証する。
  if (
    process.env.CRON_SECRET &&
    req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN' });
  }

  try {
    const cutoff = Date.now() - RETENTION_MS;
    let cursor;
    let checked = 0;
    let deleted = 0;

    do {
      const { blobs, cursor: next, hasMore } = await list({ cursor, limit: 1000 });
      checked += blobs.length;

      const expired = blobs
        .filter((b) => new Date(b.uploadedAt).getTime() < cutoff)
        .map((b) => b.url);

      for (let i = 0; i < expired.length; i += 100) {
        const chunk = expired.slice(i, i + 100);
        await del(chunk);
        deleted += chunk.length;
      }

      cursor = hasMore ? next : undefined;
    } while (cursor);

    console.log(`cleanup: checked=${checked} deleted=${deleted}`);
    return res.status(200).json({ checked, deleted });
  } catch (error) {
    console.error('cleanup failed:', error);
    return res.status(500).json({ error: error.message || 'cleanup failed' });
  }
}
