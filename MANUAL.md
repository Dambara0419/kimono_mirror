# Kimono Mirror マニュアル・仕様書

## 目次

1. [アプリ概要](#1-アプリ概要)
2. [操作マニュアル](#2-操作マニュアル)
3. [設定メニュー](#3-設定メニュー)
4. [技術仕様](#4-技術仕様)
5. [環境変数・デプロイ設定](#5-環境変数デプロイ設定)
6. [ファイル構成](#6-ファイル構成)
7. [開発手順](#7-開発手順)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. アプリ概要

**Kimono Mirror** は、AIを使ったバーチャル着物試着体験アプリです。
カメラで人物を撮影し、手に持った着物のあ柄を実際に着用した画像をGemini APIで生成して表示します。
大型モニターを繋いだPCでのキオスク設置を想定していますが、スマートフォンやタブレットからもアクセス可能です。

### 対応デバイス

ブラウザがあれば動作します。PCだけでなく、**スマートフォン・タブレット**からもアクセス可能です。

| デバイス | 備考 |
|----------|------|
| PC | キオスク設置を想定したメイン環境 |
| スマートフォン | カメラを使って単体で試着可能 |
| タブレット | 大画面で快適に使用可能 |

> ジェスチャー操作（MediaPipe）はカメラが必要です。スマートフォン・タブレットのインカメラでも動作します。

### 対応モード

| モード | 説明 |
|--------|------|
| 浴衣 | 男性・女性・子供の浴衣試着 |
| 振袖 | 女性用の振袖試着 |

---

## 2. 操作マニュアル

### 基本的な流れ

```
タイトル画面
  ↓ モード選択（浴衣 / 振袖）
撮影画面
  ↓ オプション設定 → 撮影
プレビュー画面
  ↓ QRコードで画像保存 / 印刷
```

### タイトル画面（`/`）

- 「浴衣」または「振袖」ボタンをタップしてモードを選択
- 右上の ⚙️ アイコンから設定を開ける

### 撮影画面（`/yukata` / `/furisode`）

**撮影前の準備**
- 来場者に試着したい着物の布地を手に持ってもらい、カメラの前に立つ

**オプション選択（浴衣のみ）**

| 項目 | 選択肢 |
|------|--------|
| 帯の色 | 赤・青・黄・白・黒 |
| 人物 | 女性・男性・子供 |
| 背景 | スタジオ・夏祭り・神社 |

**振袖の場合**
- 帯の色・背景のみ選択可（人物は女性固定）

**撮影方法（2通り）**
1. シャッターボタンをタップ
2. 手をシャッターボタンにかざして2秒ホバー（非接触操作）

撮影後、3秒カウントダウンで自動撮影されます。

### プレビュー画面（`/preview`）

- AI生成中は「AIが着付けをしております...」とローディング表示
- 生成完了後、画像とQRコードが表示される
- **QRコードをスキャン** → スマートフォンのブラウザで画像が開く → 長押しで保存
  - QRコードのURLは**24時間で自動削除**
- **印刷する** ボタンで印刷ダイアログを表示
- **もう一度撮影** ボタンで撮影画面に戻る

---

## 3. 設定メニュー

タイトル画面の ⚙️ から開く。設定は `localStorage` に保存され、次回起動時も維持される。

| 設定項目 | 説明 | 保存キー |
|----------|------|----------|
| カメラデバイス | 使用するカメラを選択 | `preferredCameraId` |
| 非接触AI操作 | MediaPipeによるジェスチャー操作のON/OFF | `useMediaPipe` |

---

## 4. 技術仕様

### 技術スタック

| 種別 | 内容 |
|------|------|
| フレームワーク | React 19 + Vite 7 |
| ルーティング | react-router-dom 7 |
| スタイリング | CSS Modules |
| 手認識 | MediaPipe Hands（CDN + npm） |
| AI画像生成 | Google Gemini API（`gemini-3.1-flash-image-preview`） |
| 画像ストレージ | Vercel Blob |
| QRコード生成 | qrcode.react |
| APIサーバー | Vercel サーバーレス関数 |

### ページ構成

| ルート | ファイル | 役割 |
|--------|----------|------|
| `/` | `src/pages/Home.jsx` | タイトル画面・モード選択・設定 |
| `/yukata` | `src/pages/Yukata.jsx` | 浴衣撮影画面 |
| `/furisode` | `src/pages/Furisode.jsx` | 振袖撮影画面 |
| `/preview` | `src/pages/Preview.jsx` | AI生成結果表示・QR・印刷 |

### APIエンドポイント

| エンドポイント | メソッド | 役割 |
|----------------|----------|------|
| `/api/generate` | POST | Gemini APIで着物画像を生成 |
| `/api/upload` | POST | 生成画像をVercel Blobにアップロード |

#### `/api/generate` リクエスト

```json
{
  "imageBase64": "base64エンコードされた撮影画像",
  "promptText": "生成プロンプト文字列"
}
```

#### `/api/generate` レスポンス

```json
{
  "newImage": "base64エンコードされた生成画像"
}
```

#### `/api/upload` リクエスト

```json
{
  "imageBase64": "base64エンコードされた生成画像"
}
```

#### `/api/upload` レスポンス

```json
{
  "url": "https://...vercel-storage.com/kimono-xxx.jpg"
}
```

### データフロー

```
撮影（ShutterButton）
  → canvas で映像キャプチャ（最大1280px・JPEG品質85%）
  → sessionStorage に保存
  → /preview へ遷移
  → /api/generate にPOST（Gemini APIで画像生成）
  → 生成画像を表示
  → /api/upload にPOST（Vercel Blobに保存・24時間で削除）
  → QRコード表示
```

### ストレージ

| 種別 | キー | 内容 |
|------|------|------|
| `localStorage` | `useMediaPipe` | ジェスチャー操作ON/OFF |
| `localStorage` | `preferredCameraId` | 優先カメラデバイスID |
| `sessionStorage` | `originalPhoto` | 撮影画像（base64） |
| `sessionStorage` | `costumeMode` | `yukata` または `furisode` |
| `sessionStorage` | `targetPerson` | `woman` / `man` / `child` |
| `sessionStorage` | `obiColor` | 帯の色 |
| `sessionStorage` | `backgroundStyle` | 背景スタイル |

### 手認識（MediaPipe）

- `HandTrackingContext.jsx` がProviderとして機能
- 処理レート：約15fps（66ms間隔で間引き）
- モデル複雑度：0（軽量モード）
- 検出する指：人差し指の先端（landmark[8]）
- シャッターボタンへの2秒ホバーで撮影トリガー
- 設定でOFFにするとMediaPipe処理は完全にスキップ

### 認証

Vercel Edge Middlewareによるベーシック認証を実装。
全ルート・全APIが保護対象。

---

## 5. 環境変数・デプロイ設定

### 必要な環境変数（Vercelダッシュボードで設定）

| 変数名 | 説明 |
|--------|------|
| `GEMINI_API_KEY` | Google Gemini APIキー（サーバーサイドのみ） |
| `BASIC_AUTH_USER` | ベーシック認証ユーザー名 |
| `BASIC_AUTH_PASS` | ベーシック認証パスワード |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blobトークン（Blobストア作成時に自動設定） |

### Vercel Blob設定

1. Vercelダッシュボード → **Storage** → **Create Database** → **Blob**
2. Blobストアをプロジェクトに紐付け
3. Settings → **Blob Access** を `Public` に設定

### ローカル開発

```bash
cp .env.example .env
# .env に各値を記入

npm run dev       # 開発サーバー起動（APIは動作しない）
vercel dev        # Vercel CLIでAPIも含めてローカル実行
```

---

## 6. ファイル構成

```
kimono_mirror/
├── api/
│   ├── generate.js          # Gemini API呼び出し
│   └── upload.js            # Vercel Blobアップロード
├── public/
│   └── yousai_logo_alpha.png  # favicon
├── src/
│   ├── components/
│   │   ├── Camera.jsx               # カメラ映像表示
│   │   ├── Print.jsx                # 印刷処理
│   │   ├── GestureButton/           # ホバー2秒で発火するボタン
│   │   ├── HandPointer/             # 人差し指カーソル表示
│   │   ├── HomeButton/              # ホームボタン
│   │   ├── ObiColorSelector/        # 帯の色選択
│   │   ├── PromptSelectors/         # 人物・背景選択
│   │   ├── SettingsMenu/            # 設定メニュー
│   │   └── ShutterButton/           # シャッター・カウントダウン
│   ├── config/
│   │   ├── constants.js             # タイミング定数
│   │   ├── yukataPrompt.js          # 浴衣プロンプトビルダー
│   │   └── furisodePrompt.js        # 振袖プロンプトビルダー
│   ├── contexts/
│   │   └── HandTrackingContext.jsx  # MediaPipe管理
│   ├── hooks/
│   │   └── useGestureHover.js       # ホバー判定フック
│   └── pages/
│       ├── Home.jsx / Home.module.css
│       ├── Yukata.jsx / Yukata.module.css
│       ├── Furisode.jsx
│       └── Preview.jsx / Preview.module.css
├── middleware.js            # ベーシック認証（Edge Middleware）
├── vercel.json              # Vercelルーティング設定
├── .env.example             # 環境変数テンプレート
└── CLAUDE.md                # AI向けプロジェクトガイド
```

---

## 7. 開発手順

```bash
npm install        # 依存関係インストール
npm run dev        # 開発サーバー起動
npm run build      # プロダクションビルド
npm run lint       # ESLint実行
```

### ブランチ運用

- `main` → 本番デプロイブランチ
- `feature/xxx` → 機能開発ブランチ（作業後にmainへマージ）

---

## 8. トラブルシューティング

### ベーシック認証が通らない
→ Vercelの環境変数 `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` のスペルを確認

### 画像生成が失敗する
→ `GEMINI_API_KEY` が正しく設定されているか確認
→ Vercelのファンクションログでエラー内容を確認

### QRコードが表示されない
→ Vercel BlobストアのBlob Accessが `Public` になっているか確認
→ `BLOB_READ_WRITE_TOKEN` が設定されているか確認

### カメラが起動しない
→ ブラウザのカメラ権限を確認
→ 設定メニューで正しいカメラデバイスが選択されているか確認
→ HTTPSでアクセスしているか確認（カメラはHTTPS必須）

### ジェスチャー操作が反応しない
→ 設定メニューで「非接触AI操作」がONになっているか確認
→ 十分な明るさがあるか確認
→ 人差し指を立てた状態でボタンにかざす
