# Evidence: Phase C-1 AI連携+ISBN検索

## セッション概要

| 項目 | 値 |
|------|-----|
| 日時 | 2026-03-31 |
| 構成 | Worker (pane %1) |
| タスク数 | 1 |

## 完了タスク一覧

| # | Pane | タスク | 主な対象ファイル |
|---|------|--------|------------------|
| 1 | %1 | Phase C-1 AI+ISBN | isbn-lookup.ts, isbn-lookup.tsx, book-recommend-agent.ts, book-review-agent.ts, reading-plan-agent.ts, book.ts |

## 変更ファイル一覧

| ファイル | 状態 |
|----------|------|
| `src/server/services/isbn-lookup.ts` | 新規 |
| `src/components/isbn-lookup.tsx` | 新規 |
| `src/server/agents/book-recommend-agent.ts` | 新規 |
| `src/server/agents/book-review-agent.ts` | 新規 |
| `src/server/agents/reading-plan-agent.ts` | 新規 |
| `src/server/routers/book.ts` | 更新 |

## 検証結果

| 検証項目 | 結果 | ログファイル |
|----------|------|-------------|
| TypeCheck (`tsc --noEmit`) | PASS | [typecheck.log](./typecheck.log) |
| Build (`next build`) | PASS | [build.log](./build.log) |
| Unit Tests (vitest) | 60/60 PASS | — |
| E2E Tests | 8/8 PASS | — |

## 実装詳細

### ISBN検索
- `isbn-lookup.ts`: Open Library API (`/api/books?bibkeys=ISBN:...`) をfetch、title/author/coverを抽出
- `isbn-lookup.tsx`: ISBN入力+検索ボタン+結果プレビュー+「この情報を使う」ボタン
- `book.lookupIsbn`: isbn-lookup.tsのlookupByIsbnを呼び出すよう変更

### AIエージェント (3つ)
- `book-recommend-agent.ts`: BaseAgent継承。読了書籍リストから3〜5冊の推薦を日本語Markdownで生成
- `book-review-agent.ts`: BaseAgent継承。タイトル+著者+メモから書評を生成
- `reading-plan-agent.ts`: BaseAgent継承。積読リストから週間読書スケジュールを生成

### tRPCプロシージャ (3つ追加)
- `book.getAiRecommendation`: FINISHED書籍(最大30冊)→推薦エージェント
- `book.generateReview`: bookId→本の情報取得→書評エージェント
- `book.createReadingPlan`: UNREAD書籍(最大20冊)→読書プランエージェント

## プロジェクト統計

| 項目 | 値 |
|------|-----|
| 新規ファイル数 | 5 |
| 更新ファイル数 | 1 |
| tRPCエンドポイント追加 | 3 (getAiRecommendation, generateReview, createReadingPlan) |
