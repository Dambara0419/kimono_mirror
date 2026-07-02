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
- **APIサーバー**: Vercel形式のサーバーレス関数 (`api/generate.js`, `api/upload.js`, `api/cleanup.js`)
- **画像共有**: Vercel Blob (`@vercel/blob`) + QRコード (`qrcode.react`)

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動（フロントのみ。/api/* は動かない）
vercel dev       # APIルート込みでローカル実行（Vercel CLI）
npm run build    # ビルド
npm run preview  # ビルド成果物をプレビュー
npm run lint     # ESLint
```

テストフレームワークは未導入（テストコマンドなし）。

### ドキュメント

- `MANUAL.md`（仕様書）は一部コードと乖離している: 「画像は24時間で自動削除」→ 実際は3日（`api/cleanup.js` の `RETENTION_MS`）、印刷ボタン→ 現在無効、`/api/cleanup`・`CRON_SECRET`・`scripts/` の記載なし。**仕様の根拠は常にコードを優先すること**
- `GUIDE.md` はイベント配布用の印刷ハンドアウト。バージョン表記（v1.0、`Home.jsx` のバッジと対応）・帯色/背景の選択肢・Basic認証の記入欄がハードコードされている。保持期間・印刷・UI選択肢・環境変数を変更したら両ドキュメントの更新も必要

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
5. 生成完了後、`/api/upload` に画像をPOST → Vercel Blobに保存 → URLをQRコードで表示。アップロードはベストエフォート（失敗してもtry/catchで握りつぶし、生成画像の表示は継続）。古い画像は `/api/cleanup`（Vercel Cron、1日1回）がアップロードから3日経過分を削除する

画像フォーマットの契約（変更時は両側同時に）: `originalPhoto` は data URL（`canvas.toDataURL` の出力）。`/api/generate` は data URL / 裸base64 のどちらも受けるが、レスポンスの `newImage` は**裸base64**（Preview側で `data:image/jpeg;base64,` を付けて表示する）。`/api/upload` は**裸base64のみ**（プレフィックス除去をしないため data URL を送ると壊れたBlobになる）。フィールド名 `imageBase64` / `newImage` / `url` はスキーマ検証なしの暗黙契約で、片側だけ変えても型エラーは出ず画像/QRが無言で壊れる。

`Preview.jsx` の注意点:
- `hasRequested` (useRef) で二重生成を防止。`main.jsx` の `<StrictMode>` によりdevではeffectが2回走るため、このrefガードがないと**Gemini APIが二重課金**になる（「useEffectは1回しか走らないから冗長」と消してはいけない）。エラー時と再撮影時に `hasRequested` をリセットしてリトライを可能にしている
- 生成失敗時はalert後 `/${costumeMode}` へ戻す。再撮影（handleRetake）は `originalPhoto` のみ削除する。オプション類は sessionStorage に残るが、撮影ページは useState 初期値から始まるため**選択は復元されない**（Previewのフォールバック値 yukata/woman/auto/style_studio はキー欠落時のみ適用）
- 生成中は `HandTrackingProvider` の `isEnabled={useAI && !isGenerating}` によりジェスチャーが無効（仕様）。`useMediaPipe` がオフのとき `Camera` 自体をマウントしないので再撮影ボタンはクリック専用になる
- `Print` コンポーネントは実装済みだが現在JSX上でコメントアウトされ無効。方式は `window.open` でポップアップを開き、そこに印刷用HTMLを書き込んで自己印刷→500ms後に自動クローズ（画像の縦横比から @page の向きも判定）。再有効化はポップアップブロッカーの影響を受ける

## ストレージ

- `localStorage`: `useMediaPipe`（boolean）、`preferredCameraId`
- `sessionStorage`: `originalPhoto`、`costumeMode`（yukata/furisode）、`targetPerson`、`obiColor`、`backgroundStyle`

注意点:
- `useMediaPipe` はキー未設定時のデフォルトが **true**（3ページとも `saved !== null ? saved === 'true' : true` パターン）
- `preferredCameraId` は「デフォルト（自動）」選択時に空文字 `''` が保存される（キー削除はされない）。利用側は `|| undefined` 等で補正している。`CameraSettings` はカメラ変更時に `window.location.reload()` で**ページ全体をリロード**する（未保存状態は消える）

## 設定・定数

- `src/config/constants.js` - ジェスチャータイミング定数（ホバー2秒、クールダウン1.5秒、ヒット領域パディング20pxなど）。**ただし一部は実配線されていない**: `GestureButton` の物理クリック時クールダウンは `1500` をリテラルで重複ハードコード、`CAMERA_CLEANUP_DELAY` はどこからもimportされず（`Camera.jsx` は300msをハードコード）、`ShutterButton` はヒットpaddingを `0` で上書きしている。タイミング調整は constants.js だけでは反映されないことがある
- `src/config/yukataPrompt.js` - `buildYukataPrompt({ gender, obiColor, background })`。背景・性別ごとの設定を持つ
- `src/config/furisodePrompt.js` - `buildFurisodePrompt({ obiColor, background })`。女性固定（gender引数なし）

プロンプト設定の同期契約（すべて未知キーは無警告フォールバック）:
- `BACKGROUND_PROMPTS` は yukataPrompt.js と furisodePrompt.js に**完全重複**して定義されている。背景の追加・変更は両ファイル + `BackgroundSelector` のid（`style_studio`/`style_matsuri`/`style_shrine`）の3箇所同時更新が必要。未知キーは `style_studio` にフォールバック
- `PersonSelector` の値は `woman`/`man`/`child` だが、`GENDER_CONFIG` のキーは `man`/`child`/`default` のみ。`woman`（および未知値）は `?? GENDER_CONFIG.default`（女性設定）にフォールバックして成立している。人物区分を追加するときは GENDER_CONFIG にキーを足さないと無言で女性プロンプトになる
- `obiColor` は英語id（`white`/`red`/`blue`/`yellow`/`black`）が**そのままプロンプト文に埋め込まれる**（`帯の色は ${obiColor}。`、マッピング層なし）。`auto` は色指定文を省略するセンチネルで、セレクタには存在せず（撮影ページの初期値は `red`）、Previewの sessionStorage フォールバック時のみ発生する。`auto` という名前の色オプションは作れない

## 手認識（MediaPipe）アーキテクチャ

`HandTrackingContext.jsx` がProviderとして機能。内部動作:
- `videoRef` の映像を~15fps（66ms間隔）のrAFループで解析（自前ではカメラを起動しない。映像は `Camera.jsx` が供給）
- `maxNumHands: 2`。両手の人差し指（landmark[8]）の座標を `fingerPositions`（手ごとの配列）として配信
- 座標は正規化値 (0-1)。Contextが公開する `toScreenCoords(fp)` で画面ピクセルに変換する。X軸は鏡映りのため `1 - fp.x` で反転し、さらに映像の `object-fit: cover` クロップ（scale + offset）を補正する。**生の `(1 - fp.x) * innerWidth` ではなく必ず `toScreenCoords` を使うこと**（さもないとアスペクト比のずれでヒット判定がずれる）
- `useGestureHover.js` フックが `toScreenCoords` でボタン要素との交差を判定し、ホバー継続時間に応じて `progress` (0-100) を返す。発火後は `cooldown` 中 `isBlockedRef` で再発火をブロック

UIのジェスチャー対応ボタンは3系統:
- `ShutterButton` — 2段階: ホバー/クリックでカウントダウン開始(3-2-1) → 0でcanvasに映像をキャプチャ → base64でonCapture呼び出し。フロントカメラ時は左右反転。キャプチャはカメラのフルフレームではなく**画面に見えている領域**（`takePhoto` が `toScreenCoords` と同じ cover クロップ計算を `window.innerWidth/innerHeight` 基準で複製している。カメラ表示レイアウトを全画面以外に変える場合は両方の計算を同時更新）。出力は長辺1280px以下・JPEG品質0.85 — これがAPIの10MBボディ上限内に収まる前提なので、解像度/品質を上げるときは上限に注意。省略可能な `isShootingRef` prop で撮影ロックを複数ボタン間で共有できる: Yukataは上下2つのShutterButtonに同一refを渡して二重カウントダウンを防いでいるが、**Furisodeは渡していない**ため2ボタンのロックは独立（修正するならYukataの配線を踏襲）
- `GestureButton` — 汎用のホバー発火ボタン（Previewの「再撮影」「印刷」等）。`HandPointer` が指先カーソルを描画する
- `HomeButton` — Yukata/Furisodeのホーム戻りボタン。`useGestureHover` / `toScreenCoords` を**使わない独立実装**で、生の正規化座標をハードコード領域（`fp.x` 0–0.3, `fp.y` 0–0.2 = 鏡像反転で画面右上）と照合し、独自の setTimeout（2500ms。コード内コメントの「3秒」は誤り）でドウェル判定する。一度発火すると `isClickedRef` がリセットされず、アンマウントまでジェスチャー再発火が永久にブロックされる（クールダウンなし）

前面/背面カメラの鏡像処理は3ファイルにまたがる契約: `Camera.jsx` がトラックの `facingMode`/label で背面を判定し、前面のときだけ `<video>` を `scaleX(-1)` 反転して `onFacingModeChange` でページに通知 → ページが `ShutterButton` の `isFrontCamera` に渡しキャプチャも同条件で反転する。ただし `toScreenCoords` だけは**カメラ向きに関係なく常にX反転する**ため、`preferredCameraId` で背面カメラを選ぶとポインタ/ヒット判定が左右逆になる（既知の非対称）。また `deviceId` 指定が失敗すると `Camera.jsx` は `video: true` にフォールバックするが、このとき `isFrontCamera` は初期値 true のまま更新されない。

## APIルートの注意事項

- APIルートはVercel環境を前提。ローカルで動かすには `vercel dev` を使う（`npm run dev` ではフロントのみ）
- `GEMINI_API_KEY` はサーバーサイドのみ（`process.env.GEMINI_API_KEY`）
- `api/upload.js` は `BLOB_READ_WRITE_TOKEN` も必要（Vercel Blob）
- 画像のリクエストボディ上限は10MB（`bodyParser.sizeLimit`）
- 生成パラメータは `api/generate.js` 内にハードコード: `aspectRatio: '2:3'`、`imageSize: '1K'`、`responseModalities: ["TEXT", "IMAGE"]`。レスポンスの `candidates[0].content.parts` から最初の `inlineData` 画像を取り出す

## Blob管理スクリプト

`@vercel/blob` を直接叩くワンオフ用Nodeスクリプト（`BLOB_READ_WRITE_TOKEN` 必須）:

```bash
BLOB_READ_WRITE_TOKEN=xxxx node scripts/download-blobs.mjs [出力先]  # 全画像をローカルにバックアップ（既定: blob-backup/）
BLOB_READ_WRITE_TOKEN=xxxx node scripts/delete-blobs.mjs            # 全画像を即時削除（cleanupの3日保持を待たず全消し）
```

## デプロイ・認証

- **Basic認証**: `middleware.js` が全ルート（`matcher: '/(.*)'`）にBasic認証をかける。`BASIC_AUTH_USER` / `BASIC_AUTH_PASS` 環境変数で認証情報を設定。イベント会場での限定公開を想定。**無効化パスはない** — 環境変数未設定でも認証はスキップされず、未設定のままデプロイすると全ページが401になる（認証を外すには middleware.js 自体の変更が必要）
- **SPAルーティング**: `vercel.json` の rewrites で `/api/*` 以外をすべて `index.html` に転送。`App.jsx` の BrowserRouter は `basename={import.meta.env.BASE_URL}` を使用
- **画像の自動削除**: `vercel.json` の `crons` で `/api/cleanup` を1日1回実行し、アップロードから3日経過した Blob を削除。Cron は `Authorization: Bearer ${CRON_SECRET}` を送るため、`middleware.js` はこのトークンに限り Basic認証をスキップする。このバイパスは `/api/cleanup` 限定ではなく**全ルートで有効**（トークンを知っていればどのページにもBasic認証なしで入れる）。`CRON_SECRET` 未設定だと cron が401になり cleanup が一度も実行されず Blob が溜まり続ける（`api/cleanup.js` 側の検証も未設定時は完全スキップ）
- **Blobの公開範囲**: 生成画像は `access: 'public'`・ファイル名 `kimono-${Date.now()}.jpg` でアップロードされる。共有URLは公開CDN上にあり Basic認証の**対象外**（だからQR共有が来場者のスマホで成立する。URLを知っていれば誰でも閲覧可、ファイル名はタイムスタンプで推測可能）。Vercelダッシュボードで Blob ストアの Blob Access を Public に設定しておく必要がある — QRコードが表示されないときの第一チェック項目
- **環境変数**（`.env.example` 参照）:
  - `GEMINI_API_KEY` - Gemini API（必須）
  - `BLOB_READ_WRITE_TOKEN` - Vercel Blob（画像共有・削除）
  - `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` - Basic認証（未設定だと全ページ401 = 実質必須）
  - `CRON_SECRET` - Vercel Cron 認証用（未設定だと画像自動削除が動かない = 実質必須）
