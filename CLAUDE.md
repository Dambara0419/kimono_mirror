# Kimono Mirror - Project Guide

## アプリ概要

AIを使ったバーチャル浴衣試着体験アプリ。カメラで撮影した写真をGemini APIに送り、浴衣を着た画像を生成して表示する。イベント会場での非接触インタラクションを想定した設計。

## 技術スタック

- **フレームワーク**: React + Vite
- **ルーティング**: react-router-dom
- **スタイリング**: CSS Modules
- **手認識**: MediaPipe Hands（CDN経由でロード + npm パッケージ）
- **AI生成**: Google Gemini API (`@google/genai`)、モデル: `gemini-3.1-flash-image-preview`
- **APIサーバー**: Vercel形式のサーバーレス関数 (`api/generate.js`)

## ページ構成

| ルート | ファイル | 役割 |
|--------|----------|------|
| `/` | `src/pages/Home.jsx` | タイトル画面・スタート・設定 |
| `/yukata` | `src/pages/Yukata.jsx` | カメラ + オプション選択 + 撮影 |
| `/preview` | `src/pages/Preview.jsx` | AI生成結果表示・印刷 |

## 主要コンポーネント

- `Camera.jsx` - カメラ映像表示（videoRefを受け取る）
- `ShutterButton/` - クリックまたはジェスチャーホバーで撮影トリガー（3秒カウントダウン）
- `HandPointer/` - 人差し指の位置をカーソルとして表示
- `GestureButton/` - ホバー2秒で発火するボタン
- `ObiColorSelector/` - 帯の色選択
- `PromptSelectors/PersonSelector` - 男性/女性切替
- `PromptSelectors/BackgroundSelector` - 背景スタイル選択（スタジオ/祭り/神社）
- `SettingsMenu/` - MediaPipeのON/OFF、カメラデバイス選択
- `Print.jsx` - 生成画像の印刷

## データフロー

1. Yukataページで撮影 → `sessionStorage` に画像base64保存
2. オプション（gender, obiColor, backgroundStyle）も `sessionStorage` に保存
3. Previewページで `sessionStorage` を読み取り → `buildYukataPrompt()` でプロンプト生成
4. `/api/generate` にPOST → Gemini APIで画像生成 → base64で返却

## ストレージ

- `localStorage`: `useMediaPipe`（boolean）、`preferredCameraId`
- `sessionStorage`: `originalPhoto`、`targetPerson`、`obiColor`、`backgroundStyle`

## 設定・定数

- `src/config/constants.js` - ジェスチャータイミング定数（ホバー2秒、クールダウン1.5秒など）
- `src/config/prompts.js` - AIプロンプトビルダー。背景・性別ごとの設定を持つ

## 手認識（MediaPipe）

- `HandTrackingContext.jsx` がProviderとして機能
- `videoRef` の映像をrAFループで解析し、人差し指（landmark[8]）の座標を `fingerPosition` として配信
- `useGestureHover.js` フックでボタン要素との交差を判定
- 設定でOFFにするとMediaPipe処理は完全にスキップ

## 環境変数

- `GEMINI_API_KEY` - Gemini APIキー（サーバーサイドのみ）

## 開発コマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # ビルド
npm run lint   # ESLint
```

## 注意事項

- APIルート (`api/generate.js`) はVercel環境を前提。ローカルでAPIを動かすには別途設定が必要
- MediaPipeのWASMファイルはCDN（jsDelivr）から動的にロードされる
- 撮影時にcanvasで映像を左右反転して保存（セルフィー向け）
