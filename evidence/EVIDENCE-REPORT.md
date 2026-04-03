# Evidence Report - Meta-tsundr Next Gen

**日付**: 2026-04-03
**プロジェクト**: meta-tsundr-next-gen
**レポート種別**: Gmail連携追加後 全機能証跡

## プロジェクト統計

| 項目 | 値 |
|---|---|
| ソースファイル数 (src/) | 161 |
| 総行数 (TS/TSX) | 35,282 |
| Gitコミット数 | 88 |
| ページ数 | 11 |
| tRPCルーター数 | 10 (agent, figma, linear, history, usage, export, notification, book, item, gmail) |
| E2Eテスト数 | 56+ (全PASS) |
| TypeScriptエラー | 0 |
| Docker サービス | 4 (postgres, qdrant, go-backend, web) |

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| 状態管理/API | tRPC, Prisma, Zustand |
| チャート | Recharts |
| バックエンド (Go) | gRPC, GORM, マルチDB対応 (Postgres/MySQL/SQLite/SQLServer) |
| キャッシュ | Redis/Valkey (ioredis) |
| 外部API | 楽天ブックスAPI, 楽天市場API, Amazon PA-API, Gmail API (OAuth2) |
| テスト | Vitest, Playwright |
| CI/CD | GitHub Actions (push/PR自動実行) |

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
- ソフトデリート/リストア
- Redisキャッシュ対応

### Gmail連携
- Google OAuth2によるGmail接続
- 購入確認メール自動取得・同期
- 接続状態表示（メールアドレス、最終同期日時）
- 同期実行（新規件数/スキップ/エラー表示）
- 連携解除機能
- 購入管理ページのヘッダーに統合

### UIデザインシステム
- ページ別テーマカラー（赤/青/アンバー/エメラルド/バイオレット）
- ダークモード完全対応
- Glass morphismユーティリティ
- BentoGridレイアウト（ホーム）
- PageHeaderコンポーネント（border-l-4 accent）
- フルスクリーンモバイルメニュー（fade-in-upアニメーション）
- フォーカストラップ + aria-modal（a11y準拠）

### バックエンド (Go gRPC)
- gRPCサーバー
- マルチDB対応 (Postgres/MySQL/SQLite/SQLServer)
- Health Checking Protocol
- Graceful Shutdown

### CI/CD
- GitHub Actions: push/PRトリガー自動実行
- lint-and-typecheck → test → build-web/build-agent-service
- Security Checks: npm audit, govulncheck, license-check, secret-scan（週次スケジュール）

## スクリーンショット

### ライトモード

![ホーム](./screenshots/01-home.png)
*ホーム - BentoGrid、text-display、glassカード*

![積読管理](./screenshots/02-books-list.png)
*積読管理 - 青テーマ、PageHeader (border-l-4)*

![書籍追加](./screenshots/03-books-new.png)
*書籍追加フォーム - クリアボタン付き*

![読書統計](./screenshots/04-books-stats.png)
*読書統計 - エメラルドテーマ*

![購入管理](./screenshots/05-purchases-list.png)
*購入管理 - アンバーテーマ、Gmail連携ボタン表示*

![商品追加](./screenshots/06-purchases-new.png)
*商品追加フォーム - ソース切り替え (おすすめ/Amazon/楽天)*

![購入統計](./screenshots/07-purchases-stats.png)
*購入統計ダッシュボード*

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
*ヘルスチェックAPI*

### モバイル

![フルスクリーンメニュー](./screenshots/13-fullscreen-menu.png)
*フルスクリーンモバイルメニュー (375x812, page-accent背景, fade-in-up)*

## テスト結果

| テスト種別 | 結果 | 詳細 |
|---|---|---|
| TypeCheck (tsc --noEmit) | PASS | 0 errors |
| E2Eスクリーンショット | PASS | 13枚全撮影完了 (8.2s) |
| E2E + Unit全体 | PASS | 56+ tests |
| CI (GitHub Actions) | PASS | lint-and-typecheck + test |

## ファイル構成

```
evidence/
├── EVIDENCE-REPORT.md          # This file
├── screenshots/
│   ├── 01-home.png             # ホーム (BentoGrid)
│   ├── 02-books-list.png       # 積読管理一覧
│   ├── 03-books-new.png        # 書籍追加フォーム
│   ├── 04-books-stats.png      # 読書統計
│   ├── 05-purchases-list.png   # 購入管理一覧 (Gmail連携ボタン)
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
