# 設計書: Python Agent gRPC サービス

## 概要

既存の Next.js BFF + Go gRPC バックエンドに加え、Python ベースの AI Agent サービスを gRPC で統合する。
PaddleOCR・Claude API・将来的なローカル LLM などを Python エコシステムで活用する。

---

## 1. Proto 定義案

### `proto/tsundr/agent/v1/agent.proto`

```protobuf
syntax = "proto3";

package tsundr.agent.v1;

option go_package = "github.com/fffyyyfff/meta-tsundr-next-gen/backend/gen/agent/v1";

// AI Agent サービス
service AgentService {
  // 同期実行: 結果を一括返却
  rpc ExecuteAgent(ExecuteAgentRequest) returns (ExecuteAgentResponse);

  // ストリーミング実行: 進捗をリアルタイムに返却
  rpc ExecuteAgentStream(ExecuteAgentRequest) returns (stream AgentStreamEvent);

  // ヘルスチェック
  rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
}

enum AgentType {
  AGENT_TYPE_UNSPECIFIED = 0;
  AGENT_TYPE_BOOK_RECOMMEND = 1;   // 書籍おすすめ
  AGENT_TYPE_BOOK_REVIEW = 2;      // 書評生成
  AGENT_TYPE_READING_PLAN = 3;     // 読書計画
  AGENT_TYPE_RECEIPT_OCR = 4;      // レシートOCR解析
}

message ExecuteAgentRequest {
  AgentType agent_type = 1;
  string task = 2;                 // タスク説明テキスト
  map<string, string> params = 3;  // 追加パラメータ (image_base64, mime_type 等)
  string user_id = 4;
}

message ExecuteAgentResponse {
  bool success = 1;
  string result = 2;               // JSON文字列 (エージェント固有の結果)
  string error = 3;
  int64 duration_ms = 4;
  AgentType agent_type = 5;
}

message AgentStreamEvent {
  oneof event {
    ProgressEvent progress = 1;
    ResultEvent result = 2;
    ErrorEvent error = 3;
  }
}

message ProgressEvent {
  string message = 1;
  float percentage = 2;            // 0.0 ~ 1.0
}

message ResultEvent {
  string result = 1;               // JSON文字列
  int64 duration_ms = 2;
}

message ErrorEvent {
  string message = 1;
  string code = 2;
}

message HealthCheckRequest {}

message HealthCheckResponse {
  string status = 1;               // "healthy" | "degraded"
  map<string, string> checks = 2;  // paddleocr, anthropic_api 等
}
```

---

## 2. Python サービス構成

```
agent-service/
├── pyproject.toml                # uv / poetry / pip 用
├── Dockerfile
├── src/
│   ├── server.py                 # gRPC server エントリポイント
│   ├── config.py                 # 環境変数・設定
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py               # BaseAgent ABC
│   │   ├── book_recommend.py     # 書籍おすすめ (Claude API)
│   │   ├── book_review.py        # 書評生成 (Claude API)
│   │   ├── reading_plan.py       # 読書計画 (Claude API)
│   │   └── receipt_ocr.py        # レシートOCR (PaddleOCR + Haiku)
│   ├── ocr/
│   │   ├── __init__.py
│   │   ├── paddle_engine.py      # PaddleOCR wrapper
│   │   └── text_processor.py     # OCR後テキスト整形・マスキング
│   └── generated/
│       └── agent_pb2.py          # protoc 生成コード
│       └── agent_pb2_grpc.py
├── tests/
│   ├── test_receipt_ocr.py
│   └── test_server.py
└── proto/
    └── tsundr/agent/v1/agent.proto
```

### 主要ファイルの責務

| ファイル | 責務 |
|---------|------|
| `server.py` | gRPC server 起動、AgentService 実装、graceful shutdown |
| `base.py` | `BaseAgent` ABC: `execute(task, params) -> AgentResult` |
| `receipt_ocr.py` | PaddleOCR でテキスト抽出 → クレカ番号マスキング → Haiku で構造化 |
| `paddle_engine.py` | PaddleOCR 初期化・推論（GPU/CPU 自動切替） |
| `text_processor.py` | クレカ番号マスキング（セキュリティポリシー準拠） |

---

## 3. 既存 ocr-service との統合

### 現状

```
ocr-service/          # 既存: REST API (FastAPI)
├── Dockerfile
├── app/
│   └── main.py       # POST /api/ocr/scan
```

### 統合方針

**Phase A（短期）**: ocr-service を agent-service に吸収

```
agent-service/
├── src/
│   ├── server.py          # gRPC server (新規)
│   ├── api/
│   │   └── rest.py        # REST API 互換エンドポイント (既存 ocr-service 互換)
│   └── agents/
│       └── receipt_ocr.py # gRPC + REST 両方から呼ばれる共通ロジック
```

- REST API (`/api/ocr/scan`) は後方互換のため残す
- 新規クライアント (Next.js BFF) は gRPC を使用
- `ocr-service` の Dockerfile を `agent-service` に統合

**Phase B（中期）**: REST API deprecate → gRPC 一本化

---

## 4. Next.js BFF からの呼び出しフロー

### 現行フロー（REST）

```
Browser → tRPC mutation (item.scanReceipt)
  → scanReceipt.handler.ts
    → mode='ai':  receipt-parser.ts → Claude Vision API
    → mode='ocr': ocr-client.ts    → REST /api/ocr/scan → ocr-service
```

### 新フロー（gRPC）

```
Browser → tRPC mutation (item.scanReceipt)
  → scanReceipt.handler.ts
    → mode='ai':  receipt-parser.ts → Claude Vision API (変更なし)
    → mode='ocr': agent-grpc-client.ts → gRPC AgentService.ExecuteAgent
                                           → agent-service (Python)
                                             → PaddleOCR + Haiku
```

### gRPC クライアント (TypeScript)

```typescript
// src/server/grpc-client/agent-client.ts
import { AgentServiceClient } from '@/generated/agent/v1/agent';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'localhost:50052';

export async function executeAgent(
  agentType: AgentType,
  task: string,
  params: Record<string, string>
): Promise<AgentResult> {
  const client = new AgentServiceClient(AGENT_SERVICE_URL);
  const response = await client.executeAgent({
    agentType,
    task,
    params,
    userId: 'default-user',
  });
  return response;
}
```

---

## 5. docker-compose 統合案

```yaml
services:
  # ... 既存サービス (postgres, valkey, go-backend, web) ...

  agent-service:
    build:
      context: ./agent-service
      dockerfile: Dockerfile
    ports:
      - "50052:50052"   # gRPC
      - "8100:8100"     # REST (後方互換)
    environment:
      GRPC_PORT: "50052"
      REST_PORT: "8100"
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import grpc; ch=grpc.insecure_channel('localhost:50052'); grpc.channel_ready_future(ch).result(timeout=5)"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 2G  # PaddleOCR モデルロード用
```

### ポート割り当て

| サービス | ポート | プロトコル |
|---------|--------|-----------|
| postgres | 5432 | TCP |
| valkey | 6379 | TCP |
| go-backend | 50051 | gRPC |
| agent-service | 50052 | gRPC |
| agent-service | 8100 | REST (互換) |
| web (Next.js) | 3000 | HTTP |

---

## 6. マイルストーン

| Phase | 内容 | 期間 |
|-------|------|------|
| A | Proto 定義 + Python gRPC server 雛形 + receipt_ocr agent 移植 | 1週間 |
| B | Next.js gRPC client 統合 + ocr-service 吸収 | 1週間 |
| C | book_recommend / book_review / reading_plan agent 実装 | 2週間 |
| D | ストリーミング対応 + UI 進捗表示 | 1週間 |

---

## 7. セキュリティ考慮事項

- PROPOSAL-purchase-tracker.md §4.1.1 のセキュリティポリシーを遵守
- gRPC 通信は内部ネットワーク限定（外部公開しない）
- `text_processor.py` でクレカ番号マスキングを Haiku 送信前に実施
- 画像データはメモリ処理のみ、ディスク保存禁止
- OCR テキストのログ出力禁止（`LOG_LEVEL=debug` でも除外）
