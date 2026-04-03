# Evidence Report - Meta-tsundr Next Gen

**日付**: 2026-04-03
**プロジェクト**: meta-tsundr-next-gen
**レポート種別**: UIリデザイン後 全機能証跡

## プロジェクト統計

| 項目 | 値 |
|---|---|
| ソースファイル数 | 155 |
| TypeScript/TSXファイル数 | 152 |
| 総行数(TS/TSX) | 33,183 |
| ページ数 | 11 |
| APIルート数 | 4 |

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Next.js 16, React, TypeScript, Tailwind CSS v4, shadcn/ui |
| 状態管理/API | tRPC, Prisma |
| チャート | Recharts |
| バックエンド(Go) | gRPC, GORM, マルチDB対応(Postgres/MySQL/SQLite/SQLServer) |
| キャッシュ | Redis/Valkey (ioredis) |
| テスト | Vitest, Playwright |
| CI/CD | GitHub Actions |

## 機能一覧

### 積読管理 (Books)
- 書籍CRUD操作
- 楽天ブックスAPI連携（タイトル検索、発売予定フィルター）
- ステータス管理 (UNREAD/READING/COMPLETED/ON_HOLD/DROPPED)
- 読書統計ダッシュボード
- Redisキャッシュ対応

### 購入管理 (Purchases/Items)
- 商品CRUD操作
- 楽天市場API連携（商品検索）
- カテゴリ管理 (BOOK/ELECTRONICS/DAILY_GOODS/FOOD/CLOTHING/HOBBY/OTHER)
- ステータス管理 (WISHLIST/PURCHASED/IN_USE/COMPLETED/RETURNED)
- 購入統計ダッシュボード（カテゴリ別、月別、ソース別）
- ソフトデリート/リストア
- Redisキャッシュ対応

### UIデザインシステム
- ページ別テーマカラー（赤/青/アンバー/エメラルド/バイオレット）
- ダークモード完全対応
- Glass morphismユーティリティ（Safari -webkit-backdrop-filter対応）
- マイクロインタラクション（カードホバーアニメーション）
- フルスクリーン展開メニュー（lollypop.design風）
- WCAG AAコントラスト準拠

### バックエンド (Go gRPC)
- gRPC-onlyサーバー
- マルチDB対応 (Postgres/MySQL/SQLite/SQLServer)
- Health Checking Protocol
- Graceful Shutdown (30秒)

### キャッシュ
- Redis/Valkey両対応
- Graceful degradation（Redis未接続時はキャッシュなしで動作）
- リスト系: TTL 60秒、統計系: TTL 300秒
- 変更操作時の自動キャッシュ無効化

## スクリーンショット

### ライトモード
![ホーム](./screenshots/01-home.png)
*ホーム - BentoGrid、赤テーマ*

![積読管理](./screenshots/02-books-list.png)
*積読管理 - 青テーマ*

![書籍追加](./screenshots/03-books-new.png)
*書籍追加フォーム*

![読書統計](./screenshots/04-books-stats.png)
*読書統計 - エメラルドテーマ*

![購入管理](./screenshots/05-purchases-list.png)
*購入管理 - アンバーテーマ*

![商品追加](./screenshots/06-purchases-new.png)
*商品追加フォーム*

![購入統計](./screenshots/07-purchases-stats.png)
*購入統計ダッシュボード*

![ウィッシュリスト](./screenshots/08-wishlist.png)
*ウィッシュリスト*

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

## テスト結果

| テスト種別 | 結果 | 詳細 |
|---|---|---|
| E2Eスクリーンショット | PASS | 12枚全撮影完了 (9.0s) |

## ファイル構成

```
evidence/
├── EVIDENCE-REPORT.md          # This file
├── screenshots/
│   ├── 01-home.png             # ホーム (ライトモード)
│   ├── 02-books-list.png       # 積読管理一覧
│   ├── 03-books-new.png        # 書籍追加フォーム
│   ├── 04-books-stats.png      # 読書統計
│   ├── 05-purchases-list.png   # 購入管理一覧
│   ├── 06-purchases-new.png    # 商品追加フォーム
│   ├── 07-purchases-stats.png  # 購入統計
│   ├── 08-wishlist.png         # ウィッシュリスト
│   ├── 09-dashboard.png        # AIダッシュボード
│   ├── 10-login.png            # ログインページ
│   ├── 11-dark-home.png        # ホーム (ダークモード)
│   └── 12-health-api.png       # ヘルスチェックAPI
├── logs/
│   ├── typecheck.log
│   ├── project-stats.log
│   └── evidence-capture.log
├── test-reports/
│   └── index.html
└── night-run/
    └── ...
```
