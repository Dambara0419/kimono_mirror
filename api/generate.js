// api/generate.js
import { GoogleGenAI } from "@google/genai";

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { imageBase64, promptText } = req.body;
  if (!imageBase64 || !promptText) return res.status(400).json({ error: 'Missing data' });

  const aspectRatio = '2:3';
  const resolusion = '1K'
  const t0 = Date.now();

  try {
    const pureBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    // プロジェクトのライブラリ仕様（@google/genai）に合わせた初期化
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log(`[generate] start — prompt: ${promptText.length} chars, image: ${pureBase64.length} chars (~${Math.round(pureBase64.length * 0.75 / 1024)}KB)`);

    // 🌟 ご指定の最新プレビューモデルを使用
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        { role: "user", parts: [
          { text: promptText },
          { inlineData: { mimeType: "image/jpeg", data: pureBase64 } }
        ]}
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig : {
          aspectRatio : aspectRatio,
          imageSize : resolusion,
        },
      },
    });

    let generatedImageBase64 = null;
    // レスポンスから画像を抽出
    if (response && response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (generatedImageBase64) {
      const elapsed = Date.now() - t0;
      console.log(`[generate] done — ${elapsed}ms, output: ~${Math.round(generatedImageBase64.length * 0.75 / 1024)}KB`);
      res.status(200).json({ newImage: generatedImageBase64 });
    } else {
      const elapsed = Date.now() - t0;
      console.error(`[generate] no image in response — ${elapsed}ms`, JSON.stringify(response));
      res.status(500).json({ error: 'Failed to extract image' });
    }

  } catch (error) {
    const elapsed = Date.now() - t0;
    console.error(`[generate] error — ${elapsed}ms`, error.message);
    res.status(500).json({ error: 'Gemini API Error', message: error.message });
  }
}
