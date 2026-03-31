# Stage 2 準備 Evidence — 2026-04-01

## タスク概要
gRPCクライアント基盤の構築（Connect protocol + buf toolchain）

## 変更ファイル一覧

### 新規作成（5ファイル）
| ファイル | 説明 |
|----------|------|
| `buf.yaml` | buf v2 設定: modules=backend/api/proto, deps=googleapis |
| `buf.gen.yaml` | buf codegen設定: protoc-gen-es + protoc-gen-connect-es → src/generated/proto |
| `src/server/grpc-client/index.ts` | Connect transport (HTTP/2)、GRPC_BACKEND_URL環境変数、bookServiceClient/authServiceClient (TODO) |
| `src/server/grpc-client/errors.ts` | gRPC Code → TRPCError マッピング (NOT_FOUND, UNAUTHENTICATED, INVALID_ARGUMENT等 8コード対応) |
| `src/server/grpc-client/converters.ts` | protoBookToAppBook (Timestamp→Date, enum→string), appStatusToProtoStatus |

### 更新（2ファイル）
| ファイル | 変更内容 |
|----------|----------|
| `package.json` | `proto:gen` script追加 |
| `.env.local` | `GRPC_BACKEND_URL=http://localhost:50051` 追加 |

### パッケージ追加
| パッケージ | 種別 | 用途 |
|-----------|------|------|
| `@bufbuild/protobuf` | runtime | Protobuf runtime |
| `@connectrpc/connect` | runtime | Connect protocol client |
| `@connectrpc/connect-node` | runtime | Node.js transport (HTTP/2) |
| `@bufbuild/buf` | devDep | buf CLI |
| `@bufbuild/protoc-gen-es` | devDep | Protobuf → TypeScript codegen |
| `@connectrpc/protoc-gen-connect-es` | devDep | Connect service client codegen |

## 検証結果

| 検証項目 | 結果 | ログ |
|----------|------|------|
| 型チェック (`tsc --noEmit`) | **PASS** | `typecheck.log` |
| ビルド (`next build`) | **PASS** | `build.log` |

## 次のステップ
1. backend/api/proto/ に .proto ファイルを作成 (BookService, AuthService)
2. `npm run proto:gen` で TypeScript コード生成
3. index.ts のTODOコメントを解除してクライアントを有効化
4. tRPCルーターからgRPCクライアント経由でGoバックエンドを呼び出し
