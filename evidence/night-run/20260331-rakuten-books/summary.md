# Evidence: 楽天ブックスAPI連携

## セッション概要

| 項目 | 値 |
|------|-----|
| 日時 | 2026-03-31 |
| 構成 | Worker (pane %1) |
| タスク数 | 1 |

## 完了タスク一覧

| # | Pane | タスク | 主な対象ファイル |
|---|------|--------|------------------|
| 1 | %1 | 楽天ブックスAPI連携 | rakuten-books.ts, isbn-lookup.ts, isbn-lookup.tsx, book.ts, next.config.ts |

## 変更ファイル一覧

| ファイル | 状態 |
|----------|------|
| `src/server/services/rakuten-books.ts` | 新規 |
| `src/server/services/isbn-lookup.ts` | 更新 |
| `src/components/isbn-lookup.tsx` | 更新 |
| `src/server/routers/book.ts` | 更新 |
| `next.config.ts` | 更新 |
| `.env.local` | 更新 |

## 検証結果

| 検証項目 | 結果 | ログファイル |
|----------|------|-------------|
| TypeCheck (`tsc --noEmit`) | PASS | [typecheck.log](./typecheck.log) |
| Build (`next build`) | PASS | [build.log](./build.log) |
| Unit Tests (vitest) | 60/60 PASS | — |
| E2E Tests | 8/8 PASS | — |

## 実装詳細

### 楽天ブックスAPI (`rakuten-books.ts`)
- `searchByIsbn(isbn)`: ISBNで楽天API検索、1件返却
- `searchByTitle(title, hits)`: タイトルで検索、最大10件
- RAKUTEN_APP_ID未設定時はnull/空配列を返す(フォールバック)
- レスポンスからtitle, author, isbn, largeImageUrl, mediumImageUrl, itemCaption, publisherNameを抽出

### ISBN検索フォールバック (`isbn-lookup.ts`)
- 楽天ブックスAPI → Open Library API の順でフォールバック
- 画像URLは楽天のlargeImageUrlを優先

### ISBN/タイトル検索UI (`isbn-lookup.tsx`)
- タブ切り替え(ISBN/タイトル)
- タイトル検索: `book.searchExternal` で楽天API検索
- 候補リスト表示(書影サムネイル+タイトル+著者+出版社)
- 候補クリックでonSelectコールバック

### tRPCエンドポイント
- `book.searchExternal`: タイトルで楽天API検索、最大10件返却

### next.config.ts
- `thumbnail.image.rakuten.co.jp`, `covers.openlibrary.org` をremotePatternsに追加

## プロジェクト統計

| 項目 | 値 |
|------|-----|
| 新規ファイル数 | 1 |
| 更新ファイル数 | 5 |
| tRPCエンドポイント追加 | 1 (searchExternal) |
