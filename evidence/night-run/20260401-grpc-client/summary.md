# gRPCクライアント完成 Evidence — 2026-04-01

## 変更ファイル一覧

### 新規作成（4ファイル）
| ファイル | 説明 |
|----------|------|
| `src/generated/proto/tsundoku/book/v1/types.ts` | Book, BookStatus enum, ListBooks/GetBook/CreateBook/UpdateBook/DeleteBook/UpdateBookStatus リクエスト/レスポンス型 |
| `src/generated/proto/tsundoku/auth/v1/types.ts` | Login/Register/RefreshToken リクエスト/レスポンス型, AuthUser |
| `src/server/grpc-client/book-client.ts` | getBooks, getBook, createBook, updateBook, deleteBook, updateBookStatus — 全メソッドでgRPCエラー→TRPCError変換 |
| `src/server/grpc-client/auth-client.ts` | login, register, refreshToken — 全メソッドでgRPCエラー→TRPCError変換 |

### 更新（2ファイル）
| ファイル | 変更内容 |
|----------|----------|
| `src/server/grpc-client/index.ts` | TODOコメント削除→bookClient/authClient/converters/errorsのre-export |
| `src/server/grpc-client/converters.ts` | `Record<string, unknown>`→`ProtoBook`型、`unknown`→`ProtoBookStatus`、`unknown`→`Timestamp`に型強化 |

## 検証結果

| 検証項目 | 結果 |
|----------|------|
| `npx tsc --noEmit` | **PASS** |
| `npx next build` | **PASS** |
