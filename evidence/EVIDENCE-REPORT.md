# Evidence Report - Meta-tsundr Next Gen

**日付**: 2026-04-05
**プロジェクト**: meta-tsundr-next-gen
**レポート種別**: 全機能証跡レポート (再キャプチャ)

---

## プロジェクト統計

| 項目 | 値 |
|---|---|
| ソースファイル数 (src/) | 205 |
| TypeScript/TSXファイル数 | 202 |
| 総行数 (TS/TSX) | 37,955 |
| ページ数 | 14 |
| APIルート数 | 7 (health, trpc, auth, google-auth, gmail-callback, agent-stream, test-error) |
| Gitコミット数 | 130 |
| TypeScriptエラー | 0 |
| Feature モジュール | 4 (auth, books, purchases, dashboard) |

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| アーキテクチャ | Bulletproof React + Cal.com Pattern (Feature-Sliced Design) |
| 状態管理/API | tRPC, Prisma, Zustand |
| チャート | Recharts |
| バックエンド (Go) | gRPC, GORM, マルチDB対応 (Postgres/MySQL/SQLite/SQLServer) |
| バックエンド (Python) | gRPC Agent Service (anthropic, grpcio) |
| キャッシュ | Redis/Valkey (ioredis) |
| 外部API | 楽天ブックスAPI, 楽天市場API, Amazon PA-API, Gmail API (OAuth2) |
| AI | Claude API (メール解析、書籍推薦、書評生成、レシートOCR) |
| モニタリング | Sentry (@sentry/nextjs) |
| テスト | Vitest, Playwright |
| CI/CD | GitHub Actions (manual dispatch) |
| インフラ | Docker Compose (postgres, valkey, go-backend, ocr, agent-service, web) |

## 機能一覧

### 積読管理 (Books)
- 書籍CRUD操作
- 楽天ブックスAPI連携（タイトル検索、ISBN検索、発売予定フィルター）
- ステータス管理 (UNREAD/READING/FINISHED)
- 読書統計ダッシュボード (Recharts PieChart/BarChart)
- AI書籍機能（おすすめ/書評/読書計画）
- Redisキャッシュ対応

### 購入管理 (Purchases/Items)
- 商品CRUD操作
- 楽天市場API連携（商品検索）
- Amazon PA-API連携（商品検索）
- カテゴリ管理 (BOOK/ELECTRONICS/DAILY_GOODS/FOOD/CLOTHING/HOBBY/OTHER)
- ステータス管理 (WISHLIST/PURCHASED/IN_USE/COMPLETED/RETURNED)
- 購入統計ダッシュボード（カテゴリ別、月別、ソース別）
- 画像自動エンリッチメント（商品画像の自動取得・補完）
- レシートスキャン（AI解析 / OCR解析 切替）
- 音声入力による商品登録
- ソフトデリート/リストア
- Redisキャッシュ対応

### Gmail連携
- Google OAuth2によるGmail接続
- 購入確認メール自動取得・同期
- Claude AIによるメール解析（購入情報の自動抽出）
- プレビュー → 確認フロー（解析結果を確認してから登録）
- 接続状態表示（メールアドレス、最終同期日時）
- 同期実行（新規件数/スキップ/エラー表示）
- 連携解除機能

### レシートスキャン / OCR
- AI解析モード: Claude Visionによる高精度解析
- OCR解析モード: PaddleOCR + Haikuによる高速解析
- モード切替UI（タブ形式）
- セキュリティポリシー準拠（メモリ処理のみ、クレカ番号マスキング）

### モニタリング (Sentry)
- @sentry/nextjs によるエラー追跡
- ErrorBoundaryからの自動エラー送信
- SENTRY_DSN未設定時のgraceful degradation
- テスト用エンドポイント (/api/test-error)

### UIデザインシステム
- ページ別テーマカラー（赤/青/アンバー/エメラルド/バイオレット）
- ダークモード完全対応
- Glass morphismユーティリティ
- BentoGridレイアウト（ホーム）
- PageHeaderコンポーネント（border-l-4 accent）
- フルスクリーンモバイルメニュー（fade-in-upアニメーション）
- マイクロインタラクション（hover, focus, transition）
- フォーカストラップ + aria-modal（WCAG AA準拠）

### バックエンド (Go gRPC)
- gRPCサーバー (port 50051)
- マルチDB対応 (Postgres/MySQL/SQLite/SQLServer)
- Health Checking Protocol
- Graceful Shutdown

### Python Agent gRPC サービス
- gRPCサーバー (port 50052)
- Proto定義: tsundoku.agent.v1.AgentService
- BookRecommendAgent (Claude Haiku)
- BookReviewAgent (Claude Haiku)
- gRPC Health Checking + Reflection

### キャッシュ
- Redis/Valkey によるデータキャッシュ
- Graceful degradation（キャッシュ障害時もサービス継続）

### アーキテクチャ
- Cal.com pattern によるハンドラー分離（handler/ ディレクトリ構成）
- shared/ ディレクトリによる横断的関心事の集約
- Feature-Sliced Design (features/ 配下に機能ドメインを自己完結)

### PWA
- Web App Manifest
- Service Worker
- オフラインサポート

---

## スクリーンショット

### ライトモード

![ホーム](./screenshots/01-home.png)
*ホーム - BentoGrid、text-display、glassカード*

![積読管理](./screenshots/02-books-list.png)
*積読管理 - 青テーマ、PageHeader (border-l-4)*

![書籍追加](./screenshots/03-books-new.png)
*書籍追加フォーム - クリアボタン付き*

![読書統計](./screenshots/04-books-stats.png)
*読書統計 - エメラルドテーマ、PieChart/BarChart*

![購入管理](./screenshots/05-purchases-list.png)
*購入管理 - アンバーテーマ、Gmail連携ボタン・レシートスキャン・音声入力表示*

![商品追加](./screenshots/06-purchases-new.png)
*商品追加フォーム - ソース切り替え (おすすめ/Amazon/楽天)*

![購入統計](./screenshots/07-purchases-stats.png)
*購入統計ダッシュボード - カテゴリ別/月別/ソース別*

![ウィッシュリスト](./screenshots/08-wishlist.png)
*ウィッシュリスト (/purchases?status=WISHLIST)*

![AIダッシュボード](./screenshots/09-dashboard.png)
*AIダッシュボード - バイオレットテーマ*

![ログイン](./screenshots/10-login.png)
*ログインページ*

### ダークモード

![ダークモード](./screenshots/11-dark-home.png)
*ホーム - ダークモード*

### API

![Health API](./screenshots/12-health-api.png)
*ヘルスチェックAPI (/api/health)*

### モバイル

![フルスクリーンメニュー](./screenshots/13-fullscreen-menu.png)
*フルスクリーンモバイルメニュー (page-accent背景, fade-in-up)*

---

## テスト結果

| テスト種別 | 結果 | 詳細 |
|---|---|---|
| TypeCheck (tsc --noEmit) | PASS | 0 errors |
| E2Eスクリーンショット | PASS | 13枚全撮影完了 (10.0s) |
| Playwright テスト | 13 passed | 0 failed |

---

## 最近の変更点

- **Sentry統合**: @sentry/nextjsによるエラーモニタリング追加、ErrorBoundaryからの自動送信
- **Python Agent gRPC**: 書籍レコメンド・書評生成エージェント（Claude Haiku）、Proto定義
- **音声入力機能**: Web Speech APIによる音声→テキスト→Claude AIで商品情報抽出→自動登録
- **レシートOCR統合**: AI解析/OCR解析モード切替UI、PaddleOCRサービス連携
- **画像エンリッチメント機能**: 購入商品の画像を外部APIから自動取得・補完する機能を追加
- **ハンドラー分離リファクタリング**: Cal.com pattern に基づきルーターからハンドラーを分離

---

## ファイル構成

```
evidence/
├── EVIDENCE-REPORT.md          # This file
├── screenshots/
│   ├── 01-home.png             # ホーム (BentoGrid)
│   ├── 02-books-list.png       # 積読管理一覧
│   ├── 03-books-new.png        # 書籍追加フォーム
│   ├── 04-books-stats.png      # 読書統計
│   ├── 05-purchases-list.png   # 購入管理一覧 (Gmail連携・レシート・音声)
│   ├── 06-purchases-new.png    # 商品追加フォーム
│   ├── 07-purchases-stats.png  # 購入統計
│   ├── 08-wishlist.png         # ウィッシュリスト
│   ├── 09-dashboard.png        # AIダッシュボード
│   ├── 10-login.png            # ログインページ
│   ├── 11-dark-home.png        # ホーム (ダークモード)
│   ├── 12-health-api.png       # ヘルスチェックAPI
│   └── 13-fullscreen-menu.png  # フルスクリーンメニュー (モバイル)
├── logs/
├── test-reports/
└── night-run/
```
