# Meta-tsundr Next Gen

**AI Agent-Powered Development Platform / AIエージェント内蔵型開発プラットフォーム**

An integrated platform that automates the design-to-code pipeline using AI agents built on Claude SDK and MCP (Model Context Protocol). From Figma design extraction to code generation, review, testing, and task management — all orchestrated by intelligent agents.

Figmaデザインからコード生成、レビュー、テスト、タスク管理までをAIエージェントで自動化する統合開発プラットフォームです。Claude SDKとMCP（Model Context Protocol）を基盤に構築されています。

---

## Architecture / アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                      │
│  ┌──────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │Dashboard │  │ Agent Executor │  │Workflow Runner   │  │
│  │(History) │  │ (SSE Stream)   │  │(Design-to-Code) │  │
│  └────┬─────┘  └───────┬────────┘  └───────┬─────────┘  │
│       │                │                    │            │
│       └────────────────┼────────────────────┘            │
│                        │ tRPC / SSE                      │
└────────────────────────┼─────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────┐
│               Next.js App Router (API)                   │
│  ┌─────────────────────┴──────────────────────────────┐  │
│  │              tRPC Router                            │  │
│  │  agent │ history │ figma │ linear                   │  │
│  └────────────┬───────────────────────────────────────┘  │
│               │                                          │
│  ┌────────────┴───────────────────────────────────────┐  │
│  │            Orchestrator                             │  │
│  │  ┌──────────┐ ┌────────────┐ ┌─────────┐ ┌──────┐ │  │
│  │  │ Design   │ │ CodeReview │ │ TestGen │ │ Task │ │  │
│  │  │ Agent    │ │ Agent      │ │ Agent   │ │ Mgmt │ │  │
│  │  └────┬─────┘ └─────┬──────┘ └────┬────┘ └──┬───┘ │  │
│  │       │              │             │         │     │  │
│  │       ▼              ▼             ▼         ▼     │  │
│  │    Claude SDK (Anthropic API)                      │  │
│  └────────────────────────────────────────────────────┘  │
│               │                    │                     │
│  ┌────────────┴─────┐  ┌──────────┴──────────┐          │
│  │  MCP Services    │  │  External Services   │          │
│  │  Figma MCP       │  │  PostgreSQL (Prisma) │          │
│  │  Linear MCP      │  │  Qdrant (Vectors)    │          │
│  │  Playwright MCP  │  │                      │          │
│  └──────────────────┘  └─────────────────────┘          │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack / 技術スタック

| Category | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.1 |
| **UI** | React | 19.2.4 |
| **Language** | TypeScript (strict) | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Components** | shadcn/ui (base-nova) | 4.1.1 |
| **AI** | Claude SDK (@anthropic-ai/sdk) | 0.80.0 |
| **API** | tRPC | 11.13.0 |
| **DB / ORM** | PostgreSQL + Prisma | 6.19.2 |
| **Vector DB** | Qdrant | latest |
| **State** | Zustand | 5.0.12 |
| **Server State** | TanStack React Query | 5.95.2 |
| **Validation** | Zod | 4.3.6 |
| **Icons** | Lucide React | 1.7.0 |
| **E2E Testing** | Playwright | 1.58.2 |
| **LLM Eval** | promptfoo | 0.121.3 |
| **Container** | Docker (multi-stage) | Node 22-alpine |
| **Orchestration** | Kubernetes + Helm | — |
| **GitOps** | ArgoCD | — |

---

## Setup / セットアップ

### Prerequisites / 前提条件

- Node.js 22+
- Docker & Docker Compose
- [direnv](https://direnv.net/)（環境変数管理）
- [go-task](https://taskfile.dev/)（タスクランナー）

### Installation / インストール

```bash
# 1. Clone / クローン
git clone https://github.com/fffyyyfff/meta-tsundr-next-gen.git
cd meta-tsundr-next-gen

# 2. Install dependencies / 依存インストール
npm install

# 3. Environment variables / 環境変数設定
cp .envrc.example .envrc
vi .envrc                    # APIキーを設定（詳細は docs/SETUP-API-KEYS.md）
direnv allow                 # 環境変数を有効化

# 4. Prisma client / Prismaクライアント生成
npx prisma generate

# 5. Start / 起動
task run
```

### API Keys / APIキー設定

| キー | 用途 | 必須 | 取得先 |
|------|------|------|--------|
| `RAKUTEN_APP_ID` | 書籍検索・書影取得 | **必須** | [Rakuten Developers](https://webservice.rakuten.co.jp/) |
| `ANTHROPIC_API_KEY` | AI機能（レコメンド、書評） | 推奨 | [Anthropic Console](https://console.anthropic.com/) |
| `GITHUB_CLIENT_ID/SECRET` | GitHubログイン | 任意 | GitHub → Settings → OAuth Apps |

詳細: [docs/SETUP-API-KEYS.md](./docs/SETUP-API-KEYS.md)

### Pages / ページ構成

| パス | 内容 |
|------|------|
| `/` | ホーム（メニュー） |
| `/books` | 積読管理（書籍一覧、検索、フィルター） |
| `/books/new` | 書籍追加（楽天API検索、ISBN自動入力） |
| `/books/stats` | 読書統計 |
| `/dashboard` | AIダッシュボード（管理者） |
| `/login` | ログイン |

### Task Commands / タスクコマンド

```bash
task run              # アプリ起動
task test             # 全テスト実行
task docker:up        # PostgreSQL + Qdrant 起動
task go:run           # Go gRPC サーバー起動
task security:check   # セキュリティ診断
task evidence:capture # スクリーンショット撮影
task --list           # 全コマンド一覧
```

Open [http://localhost:3000](http://localhost:3000) to access the platform.

---

## Environment Variables / 環境変数

Create `.env.local` in the project root:

`.env.local` をプロジェクトルートに作成してください:

| Variable | Description / 説明 | Example |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API key / Claude APIキー (required) | `sk-ant-api03-...` |
| `DATABASE_URL` | PostgreSQL connection string / PostgreSQL接続文字列 | `postgresql://meta_tsundr:meta_tsundr_dev@localhost:5432/meta_tsundr` |
| `QDRANT_URL` | Qdrant server URL / QdrantサーバーURL | `http://localhost:6333` |
| `FIGMA_ACCESS_TOKEN` | Figma API token / Figma APIトークン (optional) | `figd_...` |
| `LINEAR_API_KEY` | Linear API key / Linear APIキー (optional) | `lin_api_...` |
| `APP_VERSION` | Application version for health check / ヘルスチェック用バージョン | `0.1.0` |

---

## AI Agents / AIエージェント

The platform includes four specialized agents orchestrated by the Orchestrator:

プラットフォームには4つの専門エージェントが搭載されており、Orchestratorが統括します:

### Design Agent / デザインエージェント
- **Type**: `design`
- Extracts design tokens and component structure from Figma
- Generates React/TypeScript components via Claude SDK
- FigmaデザインからReact/TypeScriptコンポーネントを自動生成

### Code Review Agent / コードレビューエージェント
- **Type**: `code-review`
- Analyzes code quality, security vulnerabilities, and performance
- コード品質・セキュリティ・パフォーマンスを自動レビュー

### Test Generation Agent / テスト生成エージェント
- **Type**: `test-gen`
- Generates Playwright E2E tests from component specifications
- コンポーネント仕様からPlaywright E2Eテストを自動生成

### Task Management Agent / タスク管理エージェント
- **Type**: `task-mgmt`
- Breaks down tasks, estimates effort, integrates with Linear
- タスク分解・見積もり・Linear連携

### Design-to-Code Workflow / デザイン→コードワークフロー

The agents can be chained into an automated pipeline:

エージェントを連鎖させた自動パイプライン:

```
Design Agent → Code Review Agent → Test Gen Agent → Task Mgmt Agent
```

Each step receives context from previous steps via Qdrant vector store.

各ステップはQdrantベクトルストアを通じて前ステップのコンテキストを共有します。

---

## API Reference / APIリファレンス

All APIs are served via tRPC at `/api/trpc`.

すべてのAPIはtRPC経由で `/api/trpc` から提供されます。

### `agent` Router

| Procedure | Type | Description / 説明 |
|---|---|---|
| `agent.executeTask` | mutation | Execute a single agent task / 単一エージェントタスク実行 |
| `agent.executeWorkflow` | mutation | Run a multi-agent workflow / マルチエージェントワークフロー実行 |
| `agent.listAgents` | query | List available agents / 利用可能なエージェント一覧 |

### `history` Router

| Procedure | Type | Description / 説明 |
|---|---|---|
| `history.listExecutions` | query | Paginated execution history / 実行履歴一覧（ページネーション対応） |
| `history.getExecution` | query | Get single execution details / 実行詳細取得 |

### `figma` Router

| Procedure | Type | Description / 説明 |
|---|---|---|
| `figma.getDesign` | query | Fetch Figma design data / Figmaデザインデータ取得 |
| `figma.extractTokens` | mutation | Extract design tokens / デザイントークン抽出 |

### `linear` Router

| Procedure | Type | Description / 説明 |
|---|---|---|
| `linear.createIssue` | mutation | Create Linear issue / Linearイシュー作成 |
| `linear.listIssues` | query | List project issues / プロジェクトイシュー一覧 |

### REST Endpoints

| Endpoint | Method | Description / 説明 |
|---|---|---|
| `/api/health` | GET | Health check (status, version, checks) / ヘルスチェック |
| `/api/agent/stream` | GET (SSE) | Real-time agent execution stream / リアルタイム実行ストリーム |

#### SSE Events (`/api/agent/stream`)

| Event | Description / 説明 |
|---|---|
| `status` | Agent lifecycle updates (queued, started, agent_switch) / ライフサイクル更新 |
| `progress` | Progress percentage and message / 進捗率とメッセージ |
| `complete` | Final result payload / 最終結果 |
| `error` | Error details / エラー詳細 |

---

## Testing / テスト

### E2E Tests (Playwright)

```bash
# Run all E2E tests / 全E2Eテスト実行
npm run test:e2e

# Run with UI mode / UIモードで実行
npm run test:e2e:ui

# Run in debug mode / デバッグモードで実行
npm run test:e2e:debug
```

Test files are located in `tests/e2e/`:
- `home.spec.ts` — Home page rendering
- `agent.spec.ts` — Agent dashboard functionality
- `dashboard.spec.ts` — Execution history dashboard
- `workflow.spec.ts` — Workflow runner UI
- `health.spec.ts` — Health endpoint validation
- `agent-api.spec.ts` — tRPC agent API responses

### Type Checking / 型チェック

```bash
npx tsc --noEmit
```

### LLM Evaluation / LLM評価

```bash
# Run prompt evaluations / プロンプト評価実行
npm run eval

# View evaluation results / 評価結果を表示
npm run eval:view
```

---

## npm Scripts / npmスクリプト

| Script | Description / 説明 |
|---|---|
| `npm run dev` | Start development server / 開発サーバー起動 |
| `npm run build` | Production build / 本番ビルド |
| `npm run start` | Start production server / 本番サーバー起動 |
| `npm run lint` | Run ESLint / ESLint実行 |
| `npm run test:e2e` | Run Playwright E2E tests / E2Eテスト実行 |
| `npm run test:e2e:ui` | Playwright UI mode / Playwright UIモード |
| `npm run test:e2e:debug` | Playwright debug mode / デバッグモード |
| `npm run db:push` | Push Prisma schema to DB / スキーマをDBに反映 |
| `npm run db:migrate` | Run Prisma migrations / マイグレーション実行 |
| `npm run db:studio` | Open Prisma Studio / Prisma Studio起動 |
| `npm run db:generate` | Generate Prisma client / Prismaクライアント生成 |
| `npm run eval` | Run promptfoo evaluations / プロンプト評価実行 |
| `npm run eval:view` | View evaluation dashboard / 評価ダッシュボード表示 |

---

## Deployment / デプロイ

### Docker

```bash
# Build image / イメージビルド
docker build -t meta-tsundr-next-gen .

# Run container / コンテナ起動
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e DATABASE_URL=postgresql://... \
  meta-tsundr-next-gen
```

The Dockerfile uses a multi-stage build (Node 22-alpine) with `output: "standalone"` for minimal image size.

Dockerfileはマルチステージビルド（Node 22-alpine）を採用し、`output: "standalone"` で最小イメージサイズを実現します。

### Kubernetes / Helm

```bash
# Apply base manifests / ベースマニフェスト適用
kubectl apply -f k8s/base/

# Or deploy with Helm / Helmでデプロイ
helm install meta-tsundr k8s/helm/meta-tsundr/ \
  --set image.tag=latest \
  --set env.ANTHROPIC_API_KEY=sk-ant-...
```

K8s resources include:
- `namespace.yaml` — Dedicated namespace
- `web-deployment.yaml` — Next.js web application
- `agent-service-deployment.yaml` — Agent service
- `ingress.yaml` — Ingress routing
- `hpa.yaml` — Horizontal Pod Autoscaler

### ArgoCD (GitOps)

```bash
# Register the ArgoCD application / ArgoCDアプリケーション登録
kubectl apply -f k8s/argocd/application.yaml
```

ArgoCD watches the repository and automatically syncs deployments on push to `main`.

ArgoCDがリポジトリを監視し、`main` へのプッシュ時に自動デプロイを実行します。

---

## Project Structure / プロジェクト構成

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── trpc/           # tRPC handler
│   │   ├── health/         # Health check endpoint
│   │   └── agent/stream/   # SSE streaming endpoint
│   └── page.tsx            # Main dashboard page
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives (Button, Card, etc.)
│   ├── dashboard.tsx       # Execution history dashboard
│   ├── workflow-runner.tsx  # Design-to-code workflow UI
│   ├── agent-executor.tsx  # Agent task executor with SSE
│   └── agent-results.tsx   # Agent execution results
├── hooks/                  # Custom React hooks
│   └── useAgentStream.ts   # SSE subscription hook
├── server/
│   ├── agents/             # AI agent implementations
│   │   ├── base-agent.ts   # Abstract base agent (Claude SDK)
│   │   ├── orchestrator.ts # Agent orchestrator & workflows
│   │   ├── design-agent.ts
│   │   ├── code-review-agent.ts
│   │   ├── test-gen-agent.ts
│   │   └── task-mgmt-agent.ts
│   ├── routers/            # tRPC routers
│   ├── services/           # MCP & external service integrations
│   └── middleware/         # Health, auth, rate-limit, telemetry
├── stores/                 # Zustand state management
└── lib/                    # Utilities (tRPC provider, Prisma, cn)
k8s/                        # Kubernetes & Helm & ArgoCD configs
prisma/                     # Database schema & migrations
tests/e2e/                  # Playwright E2E tests
docs/                       # Architecture Decision Records
```

---

## License

Private / 非公開
