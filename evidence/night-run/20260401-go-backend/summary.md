# Evidence: Stage 1 Go backend セットアップ

## セッション概要

| 項目 | 値 |
|------|-----|
| 日時 | 2026-04-01 |
| 構成 | Worker (pane %1) |
| タスク数 | 1 |

## 完了タスク一覧

| # | Pane | タスク | 主な対象ファイル |
|---|------|--------|------------------|
| 1 | %1 | Go backendセットアップ | backend/** |

## 変更ファイル一覧

| ファイル | 状態 |
|----------|------|
| `backend/cmd/server/main.go` | コピー+大幅書き換え (gRPC-only) |
| `backend/go.mod` | コピー+モジュール名変更 |
| `backend/go.sum` | コピー |
| `backend/api/proto/tsundoku/**` | コピー |
| `backend/internal/domain/entity/book.go` | コピー+uuid→string, 新フィールド追加 |
| `backend/internal/domain/entity/user.go` | コピー+uuid→string |
| `backend/internal/domain/repository/*.go` | コピー+uuid→string |
| `backend/internal/domain/usecase/*.go` | コピー+uuid→string, UploadBookImage削除 |
| `backend/internal/infrastructure/database/*.go` | コピー+DatabaseConfig追加 |
| `backend/internal/infrastructure/middleware/*.go` | コピー, auth_http.go削除 |
| `backend/internal/infrastructure/repository/*.go` | コピー+uuid→string |
| `backend/internal/interface/grpc/*.go` | コピー+uuid→string, ParseUUID削除 |
| `backend/internal/usecase/*.go` | コピー+uuid→string, storage削除, JWTConfig追加 |
| `backend/Dockerfile` | 新規 |

## 削除したもの

- `internal/interface/graphql/` — GraphQL全体
- `internal/infrastructure/storage/` — GCS/ローカルストレージ
- `internal/infrastructure/cache/` — Redis
- `internal/testtools/` — テストヘルパー
- `internal/infrastructure/middleware/auth_http.go` — Gin HTTP ミドルウェア
- `internal/domain/service/image_storage.go` — 画像ストレージインターフェース

## 主な変更点

1. **モジュール名**: `dual-api-tsundoku` → `meta-tsundr-backend`
2. **ID型**: `uuid.UUID` → `string` (全ファイル一括置換)
3. **Book entity**: Notes, Rating, StartedAt, FinishedAt フィールド追加
4. **main.go**: GraphQL/Gin/gRPC-Gateway全削除、gRPC-onlyサーバー、Health Check追加
5. **usecase**: UploadBookImage削除、NewBookUseCaseSimple追加、JWTConfig構造体追加

## 検証結果

| 検証項目 | 結果 | ログファイル |
|----------|------|-------------|
| `go build ./cmd/server` | PASS | [go-build.log](./go-build.log) |
