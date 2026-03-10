// api/generate.js
import { GoogleGenAI } from "@google/genai";

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { imageBase64, promptText } = req.body;
  if (!imageBase64 || !promptText) return res.status(400).json({ error: 'Missing data' });

  try {
    const pureBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    // プロジェクトのライブラリ仕様（@google/genai）に合わせた初期化
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    console.log("⏳ Generating image (Fast Mode)...");

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
      res.status(200).json({ newImage: generatedImageBase64 });
    } else {
      console.error("Failed to extract image from response:", JSON.stringify(response));
      res.status(500).json({ error: 'Failed to extract image' });
    }

  } catch (error) {
    console.error("🔥 Gemini API Error:", error);
    res.status(500).json({ error: 'Gemini API Error', message: error.message });
  }
}
