# Evidence: Phase A バックエンド実装

## セッション概要

| 項目 | 値 |
|------|-----|
| 日時 | 2026-03-31 |
| 構成 | Worker (pane %1) |
| タスク数 | 1 |

## 完了タスク一覧

| # | Pane | タスク | 主な対象ファイル |
|---|------|--------|------------------|
| 1 | %1 | Phase A バックエンド | trpc.ts, route.ts, book.schemas.ts, book.ts, books/page.tsx, books/new/page.tsx |

## 変更ファイル一覧

| ファイル | 状態 |
|----------|------|
| `src/server/trpc.ts` | 更新 (Context型 + protectedProcedure追加) |
| `src/app/api/trpc/[trpc]/route.ts` | 更新 (cookie→auth_token→userId context注入) |
| `src/server/routers/book.schemas.ts` | 新規 (Zod v4バリデーション) |
| `src/server/routers/book.ts` | 更新 (protectedProcedure化 + restore/changeStatus/stats/lookupIsbn追加) |
| `src/app/books/page.tsx` | 更新 (userId入力削除, rating sort→updatedAt, totalCount修正) |
| `src/app/books/new/page.tsx` | 更新 (userId入力削除) |

## 検証結果

| 検証項目 | 結果 | ログファイル |
|----------|------|-------------|
| TypeCheck (`tsc --noEmit`) | PASS | [typecheck.log](./typecheck.log) |
| Build (`next build`) | PASS | [build.log](./build.log) |
| E2E Tests (dashboard+home) | 8/8 PASS | — |

## 実装詳細

### tRPC Context & Auth
- `Context = { userId: string | null }` 型定義
- `protectedProcedure`: userId nullで UNAUTHORIZED エラー
- route.ts: cookieの`auth_token`→`authService.verifyToken`→`payload.sub`をcontextに注入

### Book Router エンドポイント (9個)
- `list`: カーソルページネーション + フィルタ + 検索 + ソート + deletedAt IS NULL
- `getById`: 所有権チェック
- `create`: ctx.userId使用
- `update`: 所有権チェック + ステータス変更時の日時自動設定
- `delete`: ソフトデリート
- `restore`: deletedAt→null
- `changeStatus`: READING→startedAt, FINISHED→finishedAt自動設定
- `stats`: ステータス別カウント + 今月追加数 + 読了数
- `lookupIsbn`: Open Library API連携

## プロジェクト統計

| 項目 | 値 |
|------|-----|
| 新規ファイル数 | 1 |
| 更新ファイル数 | 5 |
| tRPCエンドポイント追加 | 4 (restore, changeStatus, stats, lookupIsbn) |
