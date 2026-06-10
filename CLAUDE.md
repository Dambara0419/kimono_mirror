# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## アプリ概要

AIを使ったバーチャル着物試着体験アプリ。カメラで撮影した写真をGemini APIに送り、着物を着た画像を生成して表示する。イベント会場での非接触インタラクションを想定した設計。

## 技術スタック

- **フレームワーク**: React + Vite
- **ルーティング**: react-router-dom
- **スタイリング**: CSS Modules
- **手認識**: MediaPipe Hands（CDN経由でロード。`window.Hands` として参照）
- **AI生成**: Google Gemini API (`@google/genai`)、モデル: `gemini-3.1-flash-image-preview`
- **APIサーバー**: Vercel形式のサーバーレス関数 (`api/generate.js`, `api/upload.js`)
- **画像共有**: Vercel Blob (`@vercel/blob`) + QRコード (`qrcode.react`)

## 開発コマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # ビルド
npm run lint   # ESLint
```

## ページ構成

| ルート | ファイル | 役割 |
|--------|----------|------|
| `/` | `src/pages/Home.jsx` | タイトル画面。浴衣/振袖モード選択・設定 |
| `/yukata` | `src/pages/Yukata.jsx` | カメラ + 性別/帯/背景選択 + 撮影 |
| `/furisode` | `src/pages/Furisode.jsx` | カメラ + 帯/背景選択 + 撮影（女性固定、PersonSelectorなし） |
| `/preview` | `src/pages/Preview.jsx` | AI生成結果表示・QRコード共有・再撮影 |

`Furisode.jsx` は `Yukata.module.css` を共用している。

## データフロー

1. Yukata/Furisodeページで撮影 → `sessionStorage` に画像base64保存
2. オプション（costumeMode, targetPerson, obiColor, backgroundStyle）も `sessionStorage` に保存
3. Previewページで `sessionStorage` を読み取り → `costumeMode` に応じて `buildYukataPrompt()` か `buildFurisodePrompt()` でプロンプト生成
4. `/api/generate` にPOST → Gemini APIで画像生成 → base64で返却
5. 生成完了後、`/api/upload` に画像をPOST → Vercel Blobに保存（24h有効）→ URLをQRコードで表示

## ストレージ

- `localStorage`: `useMediaPipe`（boolean）、`preferredCameraId`
- `sessionStorage`: `originalPhoto`、`costumeMode`（yukata/furisode）、`targetPerson`、`obiColor`、`backgroundStyle`

## 設定・定数

- `src/config/constants.js` - ジェスチャータイミング定数（ホバー2秒、クールダウン1.5秒、ヒット領域パディング20pxなど）
- `src/config/yukataPrompt.js` - `buildYukataPrompt({ gender, obiColor, background })`。背景・性別ごとの設定を持つ
- `src/config/furisodePrompt.js` - `buildFurisodePrompt({ obiColor, background })`。女性固定

## 手認識（MediaPipe）アーキテクチャ

`HandTrackingContext.jsx` がProviderとして機能。内部動作:
- `videoRef` の映像を~15fps（66ms間隔）のrAFループで解析
- 人差し指（landmark[8]）の座標を `fingerPositions` (配列) として配信
- 座標は正規化値 (0-1)。X軸は鏡映りのため `fingerX = (1 - fp.x) * window.innerWidth` で変換
- `useGestureHover.js` フックがボタン要素との交差を判定し、ホバー継続時間に応じて `progress` (0-100) を返す

ShutterButtonは2段階: ホバー/クリックでカウントダウン開始(3-2-1) → 0でcanvasに映像をキャプチャ → base64でonCapture呼び出し。フロントカメラ時は左右反転。

## APIルートの注意事項

- `api/generate.js` と `api/upload.js` はVercel環境を前提。ローカルでAPIを動かすには別途設定が必要
- `GEMINI_API_KEY` はサーバーサイドのみ（`process.env.GEMINI_API_KEY`）
- `api/upload.js` は `BLOB_READ_WRITE_TOKEN` も必要（Vercel Blob）
- 画像のリクエストボディ上限は10MB（`bodyParser.sizeLimit`）
