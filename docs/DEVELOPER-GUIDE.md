# Developer Guide - Meta-tsundr Next Gen

## プロジェクト概要

Meta-tsundr は「積読管理」から「あらゆるネット購入の統合管理プラットフォーム」に進化した Web アプリケーション。
Gmail の購入確認メールを AI エージェントが自動解析し、購入履歴を一元管理する。

---

## アーキテクチャ

```
Browser (React 19 / Next.js 16)
  │
  │ tRPC (HTTP)
  ▼
Next.js BFF (App Router)
  ├── tRPC Router ─── Prisma ──→ PostgreSQL
  ├── gRPC Client ──────────────→ Go Backend (port 50051)
  ├── gRPC Client ──────────────→ Python Agent Service (port 50052)
  ├── REST Client ──────────────→ OCR Service (port 8100)
  ├── Claude API ───────────────→ Anthropic
  ├── Gmail API ────────────────→ Google
  └── 楽天/Amazon API ──────────→ External
```

---

## ディレクトリ構造

```
meta-tsundr-next-gen/
├── src/
│   ├── app/                      # Next.js App Router (pages + API routes)
│   ├── features/                 # Feature-Sliced Design
│   │   ├── auth/                 # 認証
│   │   ├── books/                # 積読管理
│   │   ├── purchases/            # 購入管理
│   │   └── dashboard/            # AIダッシュボード
│   ├── shared/                   # 横断的関心事
│   │   ├── components/           # 共通コンポーネント
│   │   ├── ui/                   # shadcn/ui
│   │   ├── stores/               # 共通ストア
│   │   ├── hooks/                # カスタムフック
│   │   └── lib/                  # ユーティリティ (prisma, trpc, logger, sentry)
│   ├── server/                   # バックエンドロジック
│   │   ├── routers/              # tRPC routers (Cal.com handler pattern)
│   │   ├── services/             # ビジネスロジック
│   │   ├── agents/               # AI agent definitions
│   │   ├── grpc-client/          # Go gRPC client
│   │   └── middleware/           # auth, health, telemetry
│   ├── generated/                # Prisma generated client
│   └── types/                    # 共通型定義
├── backend/                      # Go gRPC バックエンド
│   ├── cmd/server/               # エントリポイント
│   ├── internal/                 # ドメインロジック
│   └── api/proto/                # Proto定義
├── ocr-service/                  # PaddleOCR サービス (Python/FastAPI)
├── agent-service/                # Python gRPC Agent サービス
├── prisma/                       # Prisma スキーマ + マイグレーション
├── tests/e2e/                    # Playwright E2E テスト
├── evidence/                     # 証跡 (スクリーンショット + レポート)
└── docs/                         # ドキュメント
```

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui |
| アーキテクチャ | Bulletproof React + Cal.com Pattern (Feature-Sliced Design) |
| 状態管理 | Zustand |
| API | tRPC (client-server), gRPC (Go/Python backend) |
| DB | PostgreSQL + Prisma ORM |
| キャッシュ | Redis/Valkey (ioredis) |
| AI | Claude API (Anthropic) |
| OCR | PaddleOCR + Haiku |
| モニタリング | Sentry (@sentry/nextjs) |
| ログ | 構造化ログ (JSON in prod, pretty in dev) |
| テスト | Playwright (E2E), Vitest (Unit) |
| CI/CD | GitHub Actions |
| インフラ | Docker Compose |

---

## 開発環境セットアップ

### 前提条件

- Node.js 22+
- Go 1.24+
- Docker / Docker Compose
- direnv (推奨)

### 手順

```bash
# 1. クローン
git clone https://github.com/fffyyyfff/meta-tsundr-next-gen.git
cd meta-tsundr-next-gen

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .envrc.example .envrc
# .envrc を編集して API キーを設定
direnv allow

# 4. インフラ起動
docker compose up -d postgres valkey

# 5. DB セットアップ
npx prisma db push
npx prisma generate

# 6. 開発サーバー起動
npm run dev
# → http://localhost:3000
```

### Taskfile (タスクランナー)

```bash
task run          # Next.js 起動
task docker:up    # PostgreSQL + Valkey 起動
task go:run       # Go gRPC サーバー起動
task ocr:run      # OCR サービス起動
task test:e2e     # Playwright テスト
task test:unit    # Vitest テスト
task db:studio    # Prisma Studio
```

---

## Docker Compose サービス

| サービス | ポート | 説明 |
|---------|--------|------|
| postgres | 5432 | PostgreSQL 16 |
| valkey | 6379 | Redis互換キャッシュ |
| go-backend | 50051 | Go gRPC サーバー |
| ocr | 8100 | PaddleOCR サービス |
| agent-service | 50052 | Python Agent gRPC |
| web | 3000 | Next.js アプリ |

---

## テスト

### E2E テスト (Playwright)

```bash
npx playwright test                    # 全テスト
npx playwright test tests/e2e/books    # 特定ファイル
npx playwright test --ui               # UI モード
```

### ユニットテスト (Vitest)

```bash
npx vitest run       # 全テスト
npx vitest --watch   # ウォッチモード
```

### 証跡キャプチャ

```bash
npx playwright test tests/e2e/evidence-capture.spec.ts
```

---

## コーディング規約

### Bulletproof React パターン

- 機能ドメインは `src/features/{domain}/` に自己完結
- 各 feature は `components/`, `stores/`, `index.ts` を持つ
- 横断的関心事は `src/shared/` に集約

### Cal.com Handler パターン

tRPC ルーターはハンドラーを分離:

```
src/server/routers/item/
├── _router.ts              # ルーター定義 (スキーマ + プロシージャ)
├── schemas.ts              # Zod スキーマ
├── list.handler.ts         # リスト取得ハンドラー
├── create.handler.ts       # 作成ハンドラー
└── ...
```

### TypeScript

- `strict: true`
- `any` 型禁止
- API キーのハードコーディング禁止
- `console.log` のコミット禁止（`createLogger()` を使用）

### コミットメッセージ

Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

---

## PR / レビューフロー

1. `feature/*` ブランチを作成
2. 実装 + テスト
3. `npx tsc --noEmit` で型チェック
4. `npx playwright test` で E2E テスト
5. PR 作成 → レビュー → マージ
6. CI (GitHub Actions) が自動実行
