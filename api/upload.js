import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });

  const buffer = Buffer.from(imageBase64, 'base64');
  const filename = `kimono-${Date.now()}.jpg`;

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });

  return res.status(200).json({ url: blob.url });
}
