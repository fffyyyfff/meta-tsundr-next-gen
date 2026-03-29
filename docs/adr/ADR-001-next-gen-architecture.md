# ADR-001: Next-Gen Architecture - AI Agent内臓型開発プラットフォーム

**ステータス**: Accepted
**日付**: 2026-03-29
**決定者**: Tech Lead
**コンテキスト**: Meta-tsundr の進化版設計

---

## 1. エグゼクティブサマリー

### 1.1 プロジェクトビジョン

Meta-tsundr を基盤に、**AIエージェント駆動型の次世代開発プラットフォーム**を構築します。このプラットフォームは以下を実現します：

- **デザイン→コード自動生成**: Figma MCP連携による自動フロントエンド生成
- **AIペアプログラミング**: マルチエージェントシステムによる開発支援
- **自動テスト生成**: Playwright AI + Evals による品質保証
- **プロジェクト管理統合**: Linear MCP連携による自動タスク管理
- **スケーラブルアーキテクチャ**: マイクロサービス対応の柔軟な構成

### 1.2 主要な技術選定

| レイヤー | 選定技術 | 理由 |
|---------|---------|------|
| **フロントエンド** | Next.js 15 + React 19 + shadcn/ui | 最新Server Components、優れたDX |
| **AIエージェント** | Claude Agent SDK + MCP | MCP統合、Extended Thinking、Claude Code実績 |
| **状態管理** | Zustand | シンプル、高速、React 19対応 |
| **API Layer** | tRPC + GraphQL（共存） | 型安全性とレガシー互換性 |
| **バックエンド** | Go 1.24 + NestJS (BFF) | 高速、スケーラブル、既存資産活用 |
| **デザイン連携** | Figma MCP + Builder.io | コンポーネントマッピング、既存コード統合 |
| **テスティング** | Playwright Test Agents + Vitest | AI自動生成、ヒーリング機能 |
| **タスク管理** | Linear MCP | 双方向同期、AI自動タスク生成 |
| **インフラ** | Kubernetes + Terraform | スケーラブル、IaC |

### 1.3 期待される効果

- **開発速度**: 50-70% 向上（デザイン→コード自動化）
- **テストカバレッジ**: 80% → 95%（AI自動生成）
- **コード品質**: AIレビューによる一貫性向上
- **タスク管理効率**: 40% 向上（自動タスク生成）
- **市場競争力**: 最先端AI機能による差別化

---

## 2. 最新技術トレンド分析（2025-2026）

### 2.1 AIエージェント技術

#### Claude Agent SDK（推奨）

**リリース**: 2025年9月（Claude Sonnet 4.5と同時）

**強み:**
- ✅ **MCP統合**: Model Context Protocol完全サポート
- ✅ **Extended Thinking**: 推論プロセスの可視化
- ✅ **実績**: Claude Codeの基盤技術
- ✅ **柔軟性**: 開発者主導、ローカルMCPサーバー対応
- ✅ **日本語対応**: 優れた多言語能力

**アーキテクチャ:**
```
Claude Agent SDK
  ↓
MCP Servers (Figma, Linear, Playwright, etc.)
  ↓
External Tools & APIs
```

**使用例:**
```typescript
import { ClaudeAgent } from '@anthropic-ai/sdk';

const agent = new ClaudeAgent({
  model: 'claude-sonnet-4.5',
  mcpServers: [
    'figma-mcp-server',
    'linear-mcp-server',
    'playwright-mcp-server'
  ],
  extendedThinking: true
});

const result = await agent.execute({
  task: 'Figmaのデザインからコンポーネントを生成し、Playwrightテストを作成'
});
```

#### OpenAI Agents SDK（代替案）

**リリース**: 2025年3月

**強み:**
- ✅ **Handoffs**: エージェント間の制御移譲が簡単
- ✅ **Guardrails**: 入出力バリデーション組み込み
- ✅ **マルチエージェント**: 特化型エージェントのオーケストレーション

**弱み:**
- ⚠️ 中央集約型（OpenAIランタイム依存）
- ⚠️ MCP対応が後付け（2025年3月）
- ⚠️ コンプライアンス面での制約

**使用例:**
```python
from openai import AgentKit

triage_agent = Agent(name="triage", handoffs=[design_agent, code_agent])
design_agent = Agent(name="design", tools=[figma_tool])
code_agent = Agent(name="code", tools=[github_tool])

result = triage_agent.run("デザインをコードに変換して")
```

#### LangGraph（高度なワークフロー用）

**用途**: 複雑な状態管理を伴うマルチエージェントワークフロー

**強み:**
- ✅ 有向グラフでエージェントフローを定義
- ✅ ステート管理が柔軟
- ✅ LangChain エコシステム統合

**弱み:**
- ⚠️ 学習コストが高い
- ⚠️ オーバーエンジニアリングのリスク

#### **推奨**: Claude Agent SDK + MCP

**理由:**
1. MCP標準対応（Figma/Linear/Playwrightとシームレス）
2. Claude Codeの実績（production-ready）
3. 開発者主導でデータ管理が容易
4. Extended Thinkingによるデバッグ性
5. 日本語プロジェクトに最適

### 2.2 MCP（Model Context Protocol）

#### 概要

**発表**: 2024年11月（Anthropic）
**オープンソース化**: 2024年11月
**業界標準化**: 2025年1-3月（Cursor, Windsurf, OpenAI, GitHub採用）

MCP は AIシステムと外部ツールを標準化されたインターフェースで接続するプロトコルです。

#### 主要なMCPサーバー（2026年3月現在）

| MCPサーバー | 提供元 | 機能 |
|-----------|-------|------|
| **Figma MCP** | Figma公式 | デザイン読み取り、解析、修正 |
| **Linear MCP** | Linear公式 | Issue管理、ステータス更新 |
| **GitHub MCP** | GitHub公式 | リポジトリ操作、PR管理 |
| **Playwright MCP** | コミュニティ | ブラウザ自動化、テスト実行 |
| **Slack MCP** | Slack公式 | メッセージ送信、チャンネル管理 |
| **Notion MCP** | Notion公式 | ページ読み書き、データベース操作 |
| **Supabase MCP** | Supabase公式 | DB操作、認証管理 |

#### MCPの利点

```
従来のアプローチ（個別統合）:
AI → [Figma API] → Figma
   → [Linear API] → Linear
   → [GitHub API] → GitHub
（各APIごとに個別実装が必要）

MCPアプローチ（標準化）:
AI → [MCP Protocol] → MCP Server (Figma)
                    → MCP Server (Linear)
                    → MCP Server (GitHub)
（統一インターフェースで全ツール連携）
```

**メリット:**
- コンテキストスイッチング不要
- 複数ツールの同時連携
- プラグイン追加が容易
- 型安全な通信

### 2.3 フロントエンド最新動向

#### Next.js 15（2024年10月リリース）

**主要機能:**
- **Turbopack** (安定版): 最大70%高速化
- **React 19対応**: Server Components、Server Actions
- **Partial Prerendering**: 静的+動的の自動最適化
- **`after` API**: レスポンス後の非同期処理
- **改善されたキャッシング**: より細かい制御

#### React 19（2024年12月リリース）

**革新的な機能:**
- **Server Components**: サーバーサイドレンダリングの進化
- **Server Actions**: フォーム処理の簡素化
- **`use()` hook**: Promise/Contextの統一インターフェース
- **`useActionState`**: Server Actions の状態管理
- **`useFormStatus`**: フォーム送信状態の取得
- **ref as prop**: `forwardRef` 不要に

#### shadcn/ui（推奨UIライブラリ）

**2025年12月**: React 19完全対応

**特徴:**
- ✅ コピー&ペーストスタイル（依存関係なし）
- ✅ Radix UI ベース（アクセシビリティ）
- ✅ Tailwind CSS v4 対応
- ✅ Server Components 対応
- ✅ カスタマイズ性が高い

**代替案比較:**

| ライブラリ | React 19 | カスタマイズ | バンドルサイズ | 学習コスト |
|----------|---------|------------|------------|----------|
| **shadcn/ui** | ✅ | ⭐⭐⭐⭐⭐ | 最小 | 低 |
| Chakra UI v3 | ✅ | ⭐⭐⭐ | 中 | 低 |
| MUI v6 | ⚠️ | ⭐⭐ | 大 | 中 |
| Ant Design | ⚠️ | ⭐⭐ | 大 | 中 |

#### 状態管理: Zustand（推奨）

**理由:**
- React 19完全対応
- 軽量（1kb未満）
- ボイラープレート不要
- Server Components対応
- Redux Toolkit比で70%少ないコード

**比較:**

| ライブラリ | バンドルサイズ | 学習コスト | React 19 | パフォーマンス |
|----------|------------|----------|---------|-------------|
| **Zustand** | 1kb | ⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| Jotai | 3kb | ⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| Redux Toolkit | 45kb | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |
| Context API | 0kb | ⭐ | ✅ | ⭐⭐ |

### 2.4 バックエンド最新動向

#### Go 1.24（推奨継続）

**新機能（2026年2月リリース）:**
- **Improved GC**: さらなるGC最適化
- **Range over Function**: イテレータのサポート
- **標準ライブラリ改善**: `encoding/json` 高速化

**理由:**
- 既存のMeta-tsundr資産を活用
- 高速（Node.js比で3-10倍）
- 並行処理に強い
- クリーンアーキテクチャとの相性が良い

#### API Layer: tRPC + GraphQL（ハイブリッド）

**推奨構成:**

```
Next.js Frontend
  ↓
tRPC (新規機能)  ←→  GraphQL (レガシー互換)
  ↓                       ↓
NestJS BFF
  ↓
Go Backend Services
```

**tRPC導入理由:**
- ✅ エンドツーエンド型安全
- ✅ コード生成不要
- ✅ Next.js Server Actions完全対応
- ✅ GraphQL比で50%少ないボイラープレート

**GraphQL維持理由:**
- ✅ 既存クライアントとの互換性
- ✅ 外部API公開用
- ✅ 柔軟なクエリ

**gRPC継続理由:**
- ✅ マイクロサービス間通信
- ✅ 高速（Protocol Buffers）
- ✅ 既存の Proto定義資産

### 2.5 テスティング最新動向

#### Playwright Test Agents（2025年発表）

**革新的な機能:**

1. **Planner Agent**: アプリを探索してテスト計画を生成
2. **Generator Agent**: 計画からPlaywrightテストを自動生成
3. **Healer Agent**: UI変更時に自動修復

**使用例:**
```typescript
import { test } from '@playwright/test';
import { planner, generator, healer } from '@playwright/ai';

// Planner Agent: テスト計画を生成
const plan = await planner.explore('https://app.example.com', {
  scenarios: ['ユーザー登録', 'ログイン', '書籍追加']
});

// Generator Agent: テストコードを生成
await generator.createTests(plan, './tests/generated/');

// Healer Agent: 壊れたテストを自動修復
test.beforeEach(async ({ page }) => {
  await healer.autoFix(page);
});
```

#### ZeroStep（自然言語テスト）

**特徴:**
- GPT-4ベースの自然言語テスト
- セレクタ不要
- UI変更に強い

**使用例:**
```typescript
import { ai } from 'zerostep';

test('ユーザー登録', async ({ page }) => {
  await page.goto('/register');
  await ai('メールアドレスを入力して登録ボタンをクリック');
  await ai('確認メッセージが表示されることを確認');
});
```

#### Visual Testing（推奨: Chromatic）

**比較:**

| ツール | AI対応 | Playwright統合 | 価格 |
|-------|-------|--------------|-----|
| **Chromatic** | ✅ | ✅ | $149/月 |
| Percy | ⚠️ | ✅ | $299/月 |
| Applitools | ✅ | ✅ | $199/月 |

#### Evals Framework（AI品質評価）

**推奨: Promptfoo + LangSmith**

```typescript
// Promptfoo でエージェント評価
import { evaluate } from 'promptfoo';

const results = await evaluate({
  prompts: ['デザインからコンポーネントを生成して'],
  providers: ['claude-sonnet-4.5'],
  tests: [
    {
      assert: [
        { type: 'contains', value: 'export default' },
        { type: 'javascript', value: 'output.includes("React")' }
      ]
    }
  ]
});
```

### 2.6 DevOps/インフラ

#### コンテナオーケストレーション: Kubernetes（推奨）

**理由:**
- 業界標準
- マイクロサービス対応
- スケーラビリティ
- 豊富なエコシステム

#### IaC: Terraform（推奨継続）

**理由:**
- マルチクラウド対応
- 既存の設計資産
- 大規模なコミュニティ

#### CI/CD: GitHub Actions（推奨継続）

**拡張:**
- Playwright Test Agents統合
- AI自動レビュー（Claude Code）
- 自動テスト生成パイプライン

---

## 3. 市場ニーズ分析

### 3.1 2025-2026年の高需要機能

| 機能カテゴリ | 市場需要 | 実装優先度 | 競合差別化 |
|------------|---------|----------|----------|
| **AIペアプログラミング** | ⭐⭐⭐⭐⭐ | 最高 | ⭐⭐⭐⭐ |
| **デザイン→コード自動化** | ⭐⭐⭐⭐⭐ | 最高 | ⭐⭐⭐⭐⭐ |
| **自動テスト生成** | ⭐⭐⭐⭐ | 高 | ⭐⭐⭐⭐ |
| **AIコードレビュー** | ⭐⭐⭐⭐ | 高 | ⭐⭐⭐ |
| **プロジェクト管理AI** | ⭐⭐⭐⭐ | 中 | ⭐⭐⭐⭐ |
| **ドキュメント自動生成** | ⭐⭐⭐ | 中 | ⭐⭐⭐ |
| **ノーコード/ローコード** | ⭐⭐⭐⭐⭐ | 高 | ⭐⭐⭐⭐⭐ |

### 3.2 ターゲット市場

**プライマリ:**
- スタートアップ（迅速なプロトタイピング）
- 中小企業（開発リソース不足）
- フリーランス開発者（生産性向上）

**セカンダリ:**
- エンタープライズ（開発効率化）
- 教育機関（学習ツール）

### 3.3 競合分析

| 製品 | デザイン連携 | AI統合 | テスト自動化 | 価格 |
|------|------------|--------|------------|-----|
| **本プロジェクト** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | TBD |
| v0.dev | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | $20/月 |
| Builder.io | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | $49/月 |
| Anima | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | $24/月 |
| GitHub Copilot | ⭐ | ⭐⭐⭐⭐ | ⭐⭐ | $10/月 |
| Cursor | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | $20/月 |

**差別化ポイント:**
1. ✅ **統合プラットフォーム**: デザイン→コード→テスト→デプロイの完全自動化
2. ✅ **MCP統合**: Figma/Linear/Playwrightのシームレスな連携
3. ✅ **マルチエージェントシステム**: 専門エージェントの協調動作
4. ✅ **オープンソース**: カスタマイズ性とコミュニティ

---

## 4. 新アーキテクチャ設計

### 4.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Next.js 15 + React 19 + shadcn/ui + Zustand               │
│  - Server Components / Server Actions                       │
│  - Tailwind CSS v4                                          │
│  - React Compiler (Auto Memoization)                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ tRPC / GraphQL / gRPC-Web
                   │
┌──────────────────┴──────────────────────────────────────────┐
│                   AI Agent Orchestration Layer               │
├─────────────────────────────────────────────────────────────┤
│  Claude Agent SDK + MCP Protocol                            │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Design      │  │ Code Review │  │ Test Gen    │        │
│  │ Agent       │  │ Agent       │  │ Agent       │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │                │
│  ┌──────┴─────────────────┴─────────────────┴──────┐       │
│  │           MCP Server Hub                         │       │
│  │  - Figma MCP                                     │       │
│  │  - Linear MCP                                    │       │
│  │  - Playwright MCP                                │       │
│  │  - GitHub MCP                                    │       │
│  │  - Custom MCP Servers                            │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ REST / gRPC / GraphQL
                   │
┌──────────────────┴──────────────────────────────────────────┐
│                   BFF Layer (NestJS 11)                      │
├─────────────────────────────────────────────────────────────┤
│  - tRPC Router (新規API)                                    │
│  - GraphQL Gateway (レガシー互換)                           │
│  - gRPC Client (マイクロサービス通信)                       │
│  - Authentication & Authorization                            │
│  - Rate Limiting & Caching                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ gRPC / REST
                   │
┌──────────────────┴──────────────────────────────────────────┐
│              Backend Services Layer (Go 1.24)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Book Service │  │ Auth Service │  │ Agent Service│     │
│  │ (gRPC)       │  │ (gRPC)       │  │ (gRPC)       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴──────┐     │
│  │         Domain Layer (Clean Architecture)          │     │
│  │  - Entities / Use Cases / Repositories              │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PostgreSQL  │  │ Redis       │  │ Vector DB   │        │
│  │ (GORM)      │  │ (Cache)     │  │ (Qdrant)    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ S3/GCS      │  │ PubSub      │                          │
│  │ (Storage)   │  │ (Events)    │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  External Services Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Figma API │ Linear API │ GitHub API │ Datadog │ SendGrid  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer (Kubernetes)             │
├─────────────────────────────────────────────────────────────┤
│  - Ingress Controller (NGINX)                                │
│  - Service Mesh (Istio - Optional)                           │
│  - Monitoring (Datadog APM, Prometheus)                      │
│  - Logging (Loki, Fluentd)                                   │
│  - CI/CD (GitHub Actions + ArgoCD)                           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 技術スタック比較表

#### フロントエンド

| 項目 | Meta-tsundr | 新アーキテクチャ | 変更理由 |
|------|-----------|--------------|---------|
| **フレームワーク** | Next.js 16.0.10 | Next.js 15.x | v15が安定版、Turbopack安定化 |
| **React** | v19.2.1 | v19.x | 同じ（最新） |
| **スタイリング** | Tailwind v4 | Tailwind v4 + shadcn/ui | UIコンポーネント標準化 |
| **状態管理** | Context API | Zustand | 軽量、高速、Server Components対応 |
| **API通信** | Apollo Client (GraphQL) + gRPC-Web | tRPC + Apollo Client | エンドツーエンド型安全 |
| **フォーム** | React Hook Form | React Hook Form | 継続（Server Actions統合） |
| **テスト** | Vitest + Testing Library | Vitest + Playwright Test Agents | AI自動テスト生成 |

#### AIエージェント層（新設）

| 項目 | 技術選定 | 理由 |
|------|---------|------|
| **エージェントSDK** | Claude Agent SDK | MCP統合、Extended Thinking |
| **MCPサーバー** | Figma/Linear/Playwright/GitHub | 公式MCPサーバー活用 |
| **エージェントタイプ** | Design/CodeReview/TestGen/TaskMgmt | 専門特化型マルチエージェント |
| **通信プロトコル** | MCP (Model Context Protocol) | 業界標準 |
| **評価フレームワーク** | Promptfoo + LangSmith | Evals統合 |

#### BFF層

| 項目 | Meta-tsundr | 新アーキテクチャ | 変更理由 |
|------|-----------|--------------|---------|
| **フレームワーク** | NestJS 11.1.9 | NestJS 11.x | 継続（最新版） |
| **API Gateway** | GraphQL | tRPC + GraphQL | 型安全性とレガシー互換性 |
| **認証** | JWT (HS256) | JWT (RS256) + OAuth2 | セキュリティ強化 |
| **レート制限** | なし | Redis Rate Limiter | 本番環境必須 |
| **キャッシング** | なし | Redis + CDN | パフォーマンス向上 |

#### バックエンド

| 項目 | Meta-tsundr | 新アーキテクチャ | 変更理由 |
|------|-----------|--------------|---------|
| **言語** | Go 1.24.1 | Go 1.24.x | 継続（最新版） |
| **フレームワーク** | Gin | Gin + Chi (マイクロサービス) | スケーラビリティ |
| **ORM** | GORM v1.31.0 | GORM v1.31.x | 継続 |
| **GraphQL** | gqlgen | gqlgen | 継続（レガシー互換） |
| **gRPC** | v1.75.1 | v1.75.x | 継続（マイクロサービス通信） |
| **AI統合** | OpenAI/Genkit デモ | Claude Agent SDK | 本格統合 |

#### データ層

| 項目 | Meta-tsundr | 新アーキテクチャ | 変更理由 |
|------|-----------|--------------|---------|
| **RDBMS** | PostgreSQL 15 | PostgreSQL 16 | 最新版、パフォーマンス向上 |
| **キャッシュ** | Redis 7 / Valkey | Redis 7 | Redis継続（実績） |
| **Vector DB** | なし | Qdrant | RAG、セマンティック検索 |
| **ストレージ** | S3 / GCS | S3 / GCS | 継続 |
| **PubSub** | なし | Redis Streams / NATS | イベント駆動アーキテクチャ |

#### インフラ

| 項目 | Meta-tsundr | 新アーキテクチャ | 変更理由 |
|------|-----------|--------------|---------|
| **コンテナ** | Docker Compose | Kubernetes (EKS/GKE) | スケーラビリティ |
| **IaC** | Terraform (準備中) | Terraform + Helm | K8s統合 |
| **CI/CD** | GitHub Actions | GitHub Actions + ArgoCD | GitOps |
| **監視** | Datadog (計画) | Datadog APM/RUM + Prometheus | 包括的監視 |
| **ログ** | 標準出力 | Loki + Fluentd | 構造化ログ、集約 |

### 4.3 各レイヤーの詳細設計

#### 4.3.1 フロントエンド（Next.js 15 + React 19）

**ディレクトリ構造:**
```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── books/
│   │   │   ├── projects/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   └── trpc/[trpc]/     # tRPC endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── features/
│   │   │   ├── books/
│   │   │   ├── auth/
│   │   │   └── agents/          # AI Agent UI
│   │   └── layouts/
│   ├── lib/
│   │   ├── trpc/                 # tRPC client
│   │   ├── apollo/               # GraphQL client (legacy)
│   │   └── utils/
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── bookStore.ts
│   │   └── agentStore.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useAgent.ts
│   └── types/
│       └── index.ts
├── public/
├── tests/
│   ├── unit/                     # Vitest
│   ├── integration/              # Testing Library
│   └── e2e/                      # Playwright Test Agents
└── package.json
```

**主要技術選定:**

```typescript
// Zustand Store
import { create } from 'zustand';

interface AgentState {
  agents: Agent[];
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  activeAgent: null,
  setActiveAgent: (agent) => set({ activeAgent: agent }),
}));

// tRPC Client
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});

// Server Component
async function BooksPage() {
  const books = await trpc.books.list.query();
  return <BookList books={books} />;
}

// Client Component with Server Action
'use client';

import { useActionState } from 'react';

function CreateBookForm() {
  const [state, formAction] = useActionState(createBook, null);

  return (
    <form action={formAction}>
      {/* ... */}
    </form>
  );
}
```

#### 4.3.2 AIエージェント層（Claude Agent SDK + MCP）

**新設レイヤー:**

```
agent-orchestration/
├── src/
│   ├── agents/
│   │   ├── design-agent/
│   │   │   ├── index.ts
│   │   │   ├── figma-to-code.ts
│   │   │   └── design-tokens.ts
│   │   ├── code-review-agent/
│   │   │   ├── index.ts
│   │   │   ├── security-check.ts
│   │   │   └── quality-check.ts
│   │   ├── test-gen-agent/
│   │   │   ├── index.ts
│   │   │   ├── playwright-gen.ts
│   │   │   └── evals.ts
│   │   └── task-mgmt-agent/
│   │       ├── index.ts
│   │       ├── linear-sync.ts
│   │       └── auto-task-gen.ts
│   ├── mcp-servers/
│   │   ├── figma-mcp/
│   │   ├── linear-mcp/
│   │   ├── playwright-mcp/
│   │   └── custom-mcp/
│   ├── orchestrator/
│   │   ├── agent-coordinator.ts
│   │   ├── task-queue.ts
│   │   └── context-manager.ts
│   └── evals/
│       ├── promptfoo-config.ts
│       └── test-cases/
├── package.json
└── tsconfig.json
```

**Design Agent 実装例:**

```typescript
import { ClaudeAgent } from '@anthropic-ai/sdk';
import { FigmaMCP } from './mcp-servers/figma-mcp';
import { Builder } from '@builder.io/sdk';

export class DesignToCodeAgent {
  private agent: ClaudeAgent;
  private figmaMCP: FigmaMCP;
  private builder: Builder;

  constructor() {
    this.agent = new ClaudeAgent({
      model: 'claude-sonnet-4.5',
      mcpServers: ['figma-mcp-server'],
      extendedThinking: true,
    });

    this.figmaMCP = new FigmaMCP();
    this.builder = new Builder({ apiKey: process.env.BUILDER_API_KEY });
  }

  async convertDesignToCode(figmaUrl: string): Promise<GeneratedCode> {
    // Step 1: Figma デザインを取得
    const design = await this.figmaMCP.fetchDesign(figmaUrl);

    // Step 2: デザイントークンを抽出
    const tokens = await this.extractDesignTokens(design);

    // Step 3: コンポーネント構造を分析
    const componentTree = await this.agent.execute({
      task: `以下のFigmaデザインからReactコンポーネント構造を提案してください`,
      context: { design, tokens },
    });

    // Step 4: Builder.io でコード生成
    const code = await this.builder.generateCode({
      design,
      framework: 'react',
      styling: 'tailwindcss',
      componentMapping: this.getExistingComponents(),
    });

    // Step 5: AIでコードレビュー
    const reviewed = await this.agent.execute({
      task: '生成されたコードをレビューし、改善点を提案してください',
      context: { code },
    });

    return {
      components: code,
      tokens,
      review: reviewed,
    };
  }

  private async extractDesignTokens(design: FigmaDesign) {
    return this.agent.execute({
      task: 'Figmaデザインからデザイントークン（色、フォント、スペーシング）を抽出',
      context: { design },
    });
  }

  private getExistingComponents(): ComponentMapping {
    // 既存のshadcn/uiコンポーネントとマッピング
    return {
      Button: '@/components/ui/button',
      Input: '@/components/ui/input',
      Card: '@/components/ui/card',
      // ...
    };
  }
}
```

**Test Generation Agent 実装例:**

```typescript
import { ClaudeAgent } from '@anthropic-ai/sdk';
import { PlaywrightMCP } from './mcp-servers/playwright-mcp';
import { test } from '@playwright/test';

export class TestGenerationAgent {
  private agent: ClaudeAgent;
  private playwrightMCP: PlaywrightMCP;

  constructor() {
    this.agent = new ClaudeAgent({
      model: 'claude-sonnet-4.5',
      mcpServers: ['playwright-mcp-server'],
    });

    this.playwrightMCP = new PlaywrightMCP();
  }

  async generateTests(component: string, url: string): Promise<string> {
    // Step 1: Playwright Test Agents で探索
    const plan = await this.playwrightMCP.planTests(url, {
      scenarios: ['正常系', '異常系', 'エッジケース'],
    });

    // Step 2: Claude Agent でテストコード生成
    const testCode = await this.agent.execute({
      task: `以下のテスト計画からPlaywrightテストを生成してください`,
      context: { plan, component },
    });

    // Step 3: Healer Agentで自動修復設定
    const healedTests = await this.playwrightMCP.addHealing(testCode);

    return healedTests;
  }

  async runEvals(testCode: string): Promise<EvalResults> {
    // Promptfoo でテスト品質を評価
    const evals = await this.agent.execute({
      task: 'このテストコードの品質を評価してください（カバレッジ、保守性、信頼性）',
      context: { testCode },
    });

    return evals;
  }
}
```

#### 4.3.3 BFF層（NestJS + tRPC）

**ディレクトリ構造:**
```
bff/
├── src/
│   ├── trpc/
│   │   ├── routers/
│   │   │   ├── books.router.ts
│   │   │   ├── auth.router.ts
│   │   │   └── agents.router.ts
│   │   ├── context.ts
│   │   └── trpc.ts
│   ├── graphql/                  # Legacy support
│   │   ├── resolvers/
│   │   └── schema.graphql
│   ├── grpc/
│   │   ├── clients/
│   │   └── services/
│   ├── auth/
│   │   ├── jwt.strategy.ts
│   │   ├── oauth.strategy.ts
│   │   └── guards/
│   └── main.ts
└── package.json
```

**tRPC Router 実装例:**

```typescript
// trpc/trpc.ts
import { initTRPC } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// trpc/routers/books.router.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { BookService } from '@/grpc/clients/book.client';

const bookService = new BookService();

export const booksRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.enum(['UNREAD', 'READING', 'FINISHED']).optional() }))
    .query(async ({ input, ctx }) => {
      return bookService.listBooks({
        userId: ctx.user.id,
        status: input.status,
      });
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      isbn: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return bookService.createBook({
        userId: ctx.user.id,
        ...input,
      });
    }),
});

// trpc/routers/agents.router.ts
import { router, protectedProcedure } from '../trpc';
import { DesignToCodeAgent } from '@/agents/design-agent';
import { TestGenerationAgent } from '@/agents/test-gen-agent';

const designAgent = new DesignToCodeAgent();
const testGenAgent = new TestGenerationAgent();

export const agentsRouter = router({
  convertDesign: protectedProcedure
    .input(z.object({ figmaUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      return designAgent.convertDesignToCode(input.figmaUrl);
    }),

  generateTests: protectedProcedure
    .input(z.object({ component: z.string(), url: z.string().url() }))
    .mutation(async ({ input }) => {
      return testGenAgent.generateTests(input.component, input.url);
    }),
});

// trpc/routers/_app.ts
import { router } from '../trpc';
import { booksRouter } from './books.router';
import { authRouter } from './auth.router';
import { agentsRouter } from './agents.router';

export const appRouter = router({
  books: booksRouter,
  auth: authRouter,
  agents: agentsRouter,
});

export type AppRouter = typeof appRouter;
```

#### 4.3.4 バックエンド（Go - マイクロサービス化）

**新しいサービス構成:**

```
backend/
├── cmd/
│   ├── book-service/
│   ├── auth-service/
│   ├── agent-service/          # 新設
│   └── api-gateway/            # 新設（Optional）
├── internal/
│   ├── book/
│   │   ├── domain/
│   │   ├── usecase/
│   │   ├── interface/
│   │   │   └── grpc/
│   │   └── infrastructure/
│   ├── auth/
│   │   └── ...
│   └── agent/                  # 新設
│       ├── domain/
│       │   ├── entity/
│       │   │   ├── agent.go
│       │   │   └── task.go
│       │   └── repository/
│       ├── usecase/
│       │   ├── agent_orchestrator.go
│       │   └── mcp_integration.go
│       └── infrastructure/
│           ├── claude/
│           │   └── claude_client.go
│           └── mcp/
│               ├── figma_mcp.go
│               ├── linear_mcp.go
│               └── playwright_mcp.go
└── api/
    └── proto/
        └── agent/
            └── v1/
                └── agent.proto
```

**Agent Service 実装例:**

```go
// internal/agent/domain/entity/agent.go
package entity

type Agent struct {
    ID          string
    Type        AgentType
    Status      AgentStatus
    Config      AgentConfig
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type AgentType string

const (
    AgentTypeDesign     AgentType = "design"
    AgentTypeCodeReview AgentType = "code_review"
    AgentTypeTestGen    AgentType = "test_generation"
    AgentTypeTaskMgmt   AgentType = "task_management"
)

// internal/agent/usecase/agent_orchestrator.go
package usecase

import (
    "context"
    "github.com/anthropic-ai/sdk-go"
)

type AgentOrchestrator struct {
    claudeClient *anthropic.Client
    mcpServers   []MCPServer
}

func NewAgentOrchestrator(apiKey string, mcpServers []MCPServer) *AgentOrchestrator {
    return &AgentOrchestrator{
        claudeClient: anthropic.NewClient(apiKey),
        mcpServers:   mcpServers,
    }
}

func (o *AgentOrchestrator) ExecuteTask(ctx context.Context, task Task) (*TaskResult, error) {
    // Step 1: タスクに適したエージェントを選択
    agent := o.selectAgent(task.Type)

    // Step 2: MCPサーバーと連携
    mcpContext := o.buildMCPContext(task)

    // Step 3: Claude Agent SDKでタスク実行
    result, err := o.claudeClient.ExecuteAgent(ctx, &anthropic.AgentRequest{
        Model:          "claude-sonnet-4.5",
        MCPServers:     o.mcpServers,
        Task:           task.Description,
        Context:        mcpContext,
        ExtendedThinking: true,
    })

    if err != nil {
        return nil, err
    }

    return &TaskResult{
        AgentID:   agent.ID,
        Output:    result.Output,
        Thinking:  result.Thinking,
        Status:    TaskStatusCompleted,
    }, nil
}

// internal/agent/infrastructure/claude/claude_client.go
package claude

import (
    "context"
    "github.com/anthropic-ai/sdk-go"
)

type ClaudeClient struct {
    client *anthropic.Client
}

func NewClaudeClient(apiKey string) *ClaudeClient {
    return &ClaudeClient{
        client: anthropic.NewClient(apiKey),
    }
}

func (c *ClaudeClient) ExecuteAgent(ctx context.Context, req *AgentRequest) (*AgentResponse, error) {
    // Claude Agent SDK API呼び出し
    response, err := c.client.Messages.Create(ctx, &anthropic.MessageRequest{
        Model:   req.Model,
        Messages: []anthropic.Message{
            {
                Role:    "user",
                Content: req.Task,
            },
        },
        MaxTokens: 4096,
        Tools:     c.buildMCPTools(req.MCPServers),
    })

    if err != nil {
        return nil, err
    }

    return &AgentResponse{
        Output:   response.Content[0].Text,
        Thinking: c.extractThinking(response),
    }, nil
}
```

---

## 5. MCP連携設計

### 5.1 Figma MCP

#### 5.1.1 Figma API連携

```typescript
// agent-orchestration/src/mcp-servers/figma-mcp/index.ts
import * as Figma from 'figma-api';

export class FigmaMCP {
  private api: Figma.Api;

  constructor(accessToken: string) {
    this.api = new Figma.Api({ personalAccessToken: accessToken });
  }

  async fetchDesign(fileKey: string): Promise<FigmaDesign> {
    const file = await this.api.getFile(fileKey);
    return {
      name: file.name,
      document: file.document,
      components: file.components,
      styles: file.styles,
    };
  }

  async extractComponents(fileKey: string): Promise<ComponentMetadata[]> {
    const file = await this.api.getFile(fileKey);
    const components: ComponentMetadata[] = [];

    function traverse(node: Figma.Node) {
      if (node.type === 'COMPONENT') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type,
          properties: extractProperties(node),
        });
      }
      if ('children' in node) {
        node.children.forEach(traverse);
      }
    }

    traverse(file.document);
    return components;
  }

  async extractDesignTokens(fileKey: string): Promise<DesignTokens> {
    const file = await this.api.getFile(fileKey);
    const styles = await this.api.getFileStyles(fileKey);

    return {
      colors: this.extractColors(styles),
      typography: this.extractTypography(styles),
      spacing: this.extractSpacing(file.document),
      borderRadius: this.extractBorderRadius(styles),
    };
  }

  private extractColors(styles: any): ColorToken[] {
    return Object.values(styles.meta.styles)
      .filter((style: any) => style.style_type === 'FILL')
      .map((style: any) => ({
        name: style.name,
        value: this.rgbaToHex(style.fill_color),
        category: this.categorizeColor(style.name),
      }));
  }

  private extractTypography(styles: any): TypographyToken[] {
    return Object.values(styles.meta.styles)
      .filter((style: any) => style.style_type === 'TEXT')
      .map((style: any) => ({
        name: style.name,
        fontSize: style.font_size,
        fontWeight: style.font_weight,
        lineHeight: style.line_height,
        letterSpacing: style.letter_spacing,
      }));
  }
}
```

#### 5.1.2 デザイン→コンポーネント自動生成フロー

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Figma Design Fetch                                  │
│  - Figma API でデザインファイルを取得                        │
│  - コンポーネント構造を解析                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│ Step 2: Design Tokens Extraction                            │
│  - カラー、タイポグラフィ、スペーシングを抽出                │
│  - Tailwind CSS設定ファイルを生成                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│ Step 3: Component Mapping (Builder.io)                      │
│  - 既存のshadcn/uiコンポーネントとマッピング                 │
│  - カスタムコンポーネントの識別                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│ Step 4: Code Generation (Claude Agent)                      │
│  - Builder.io でReactコンポーネントを生成                    │
│  - Claude Agent でコード品質レビュー                         │
│  - TypeScript型定義を自動生成                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│ Step 5: Test Generation (Playwright Agent)                  │
│  - 生成されたコンポーネントのテストを自動生成                │
│  - Visual Regression Testを追加                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│ Step 6: PR Creation (GitHub MCP)                            │
│  - 生成されたコードで自動的にPR作成                          │
│  - Linear Issueとの紐付け                                    │
└─────────────────────────────────────────────────────────────┘
```

#### 5.1.3 実装例（エンドツーエンド）

```typescript
// Design to Code Workflow
export class FigmaToCodeWorkflow {
  private figmaMCP: FigmaMCP;
  private designAgent: DesignToCodeAgent;
  private testGenAgent: TestGenerationAgent;
  private githubMCP: GitHubMCP;
  private linearMCP: LinearMCP;

  async execute(figmaUrl: string, linearIssueId: string): Promise<WorkflowResult> {
    // Step 1: Figma デザインを取得
    const design = await this.figmaMCP.fetchDesign(figmaUrl);
    const tokens = await this.figmaMCP.extractDesignTokens(figmaUrl);

    // Step 2: コンポーネントを生成
    const generatedCode = await this.designAgent.convertDesignToCode(figmaUrl);

    // Step 3: テストを生成
    const tests = await this.testGenAgent.generateTests(
      generatedCode.components,
      'http://localhost:3000'
    );

    // Step 4: PRを作成
    const pr = await this.githubMCP.createPR({
      title: `feat: Figmaデザインからコンポーネントを生成 (${design.name})`,
      body: this.generatePRDescription(design, generatedCode),
      files: [
        ...generatedCode.components,
        ...tests,
        { path: 'tailwind.config.ts', content: tokens.tailwindConfig },
      ],
    });

    // Step 5: Linear Issueを更新
    await this.linearMCP.updateIssue(linearIssueId, {
      status: 'In Review',
      comment: `PR created: ${pr.url}`,
      attachments: [pr.url],
    });

    return {
      design,
      generatedCode,
      tests,
      pr,
      linearIssue: linearIssueId,
    };
  }

  private generatePRDescription(design: FigmaDesign, code: GeneratedCode): string {
    return `
## 生成されたコンポーネント

Figmaデザイン: ${design.name}

### コンポーネント一覧
${code.components.map(c => `- ${c.name}`).join('\n')}

### デザイントークン
- カラー: ${code.tokens.colors.length}個
- タイポグラフィ: ${code.tokens.typography.length}個

### AI レビュー
${code.review.summary}

### テスト
- ユニットテスト: ${code.tests.unit.length}個
- Visual Regression: ${code.tests.visual.length}個

---
🤖 Generated by AI Design Agent
    `;
  }
}
```

### 5.2 Linear MCP

#### 5.2.1 双方向同期

```typescript
// agent-orchestration/src/mcp-servers/linear-mcp/index.ts
import { LinearClient } from '@linear/sdk';

export class LinearMCP {
  private client: LinearClient;

  constructor(apiKey: string) {
    this.client = new LinearClient({ apiKey });
  }

  async syncIssues(projectId: string): Promise<Issue[]> {
    const issues = await this.client.issues({
      filter: { project: { id: { eq: projectId } } },
    });

    return issues.nodes.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.state.name,
      assignee: issue.assignee?.name,
      labels: issue.labels.nodes.map(l => l.name),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    }));
  }

  async createIssue(data: CreateIssueInput): Promise<Issue> {
    const result = await this.client.createIssue({
      teamId: data.teamId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      labelIds: data.labelIds,
    });

    return result.issue;
  }

  async updateIssue(issueId: string, data: UpdateIssueInput): Promise<Issue> {
    const result = await this.client.updateIssue(issueId, {
      stateId: data.stateId,
      description: data.description,
    });

    return result.issue;
  }

  async createComment(issueId: string, body: string): Promise<Comment> {
    const result = await this.client.createComment({
      issueId,
      body,
    });

    return result.comment;
  }
}
```

#### 5.2.2 AIエージェントによる自動タスク生成

```typescript
// Task Management Agent
export class TaskManagementAgent {
  private agent: ClaudeAgent;
  private linearMCP: LinearMCP;

  async analyzeAndCreateTasks(
    requirement: string,
    projectId: string
  ): Promise<Task[]> {
    // Step 1: Claude Agent で要件を分析
    const analysis = await this.agent.execute({
      task: `以下の要件をタスクに分解してください。各タスクには以下を含めてください：
        - タイトル
        - 詳細説明
        - 優先度（Urgent/High/Medium/Low）
        - 見積もり（S/M/L）
        - 依存関係`,
      context: { requirement },
    });

    // Step 2: Linearにタスクを作成
    const tasks: Task[] = [];
    for (const taskData of analysis.tasks) {
      const issue = await this.linearMCP.createIssue({
        teamId: projectId,
        title: taskData.title,
        description: this.formatTaskDescription(taskData),
        priority: this.mapPriority(taskData.priority),
        labelIds: this.getLabelIds(taskData.labels),
      });

      tasks.push(issue);
    }

    // Step 3: 依存関係を設定
    await this.setupDependencies(tasks, analysis.dependencies);

    return tasks;
  }

  private formatTaskDescription(taskData: any): string {
    return `
## タスク概要
${taskData.description}

## 受け入れ基準
${taskData.acceptanceCriteria.map((ac: string) => `- ${ac}`).join('\n')}

## 技術的な考慮事項
${taskData.technicalNotes}

## 見積もり
サイズ: ${taskData.estimateSize}

---
🤖 Generated by AI Task Management Agent
    `;
  }

  async autoUpdateProgress(): Promise<void> {
    // GitHubのPRステータスを監視してLinearを自動更新
    const prs = await this.githubMCP.listPRs({ state: 'open' });

    for (const pr of prs) {
      const linkedIssues = this.extractLinearIssues(pr.body);

      for (const issueId of linkedIssues) {
        if (pr.mergeable && pr.reviews.length > 0) {
          await this.linearMCP.updateIssue(issueId, {
            stateId: 'in-review',
          });
        }

        if (pr.merged) {
          await this.linearMCP.updateIssue(issueId, {
            stateId: 'done',
          });
        }
      }
    }
  }
}
```

### 5.3 Playwright MCP

#### 5.3.1 E2Eテストシナリオ自動生成

```typescript
// agent-orchestration/src/mcp-servers/playwright-mcp/index.ts
import { chromium, Browser, Page } from 'playwright';
import { planner, generator, healer } from '@playwright/ai';

export class PlaywrightMCP {
  private browser: Browser;

  async initialize() {
    this.browser = await chromium.launch();
  }

  async planTests(
    url: string,
    options: PlanTestsOptions
  ): Promise<TestPlan> {
    const page = await this.browser.newPage();
    await page.goto(url);

    // Planner Agent: アプリを探索してテスト計画を生成
    const plan = await planner.explore(page, {
      scenarios: options.scenarios,
      maxDepth: 3,
      excludePatterns: ['/api/', '/admin/'],
    });

    await page.close();
    return plan;
  }

  async generateTestCode(plan: TestPlan): Promise<string> {
    // Generator Agent: テスト計画からコードを生成
    const testCode = await generator.createTests(plan, {
      framework: 'playwright',
      language: 'typescript',
      assertions: 'expect',
      pageObjects: true,
    });

    return testCode;
  }

  async addHealing(testCode: string): Promise<string> {
    // Healer Agent: 自動修復機能を追加
    const healedCode = testCode.replace(
      /test\(/g,
      `test.beforeEach(async ({ page }) => {
  await healer.autoFix(page);
});

test(`
    );

    return healedCode;
  }

  async runVisualTests(
    url: string,
    components: string[]
  ): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = [];

    for (const component of components) {
      const page = await this.browser.newPage();
      await page.goto(`${url}/${component}`);

      // スクリーンショット撮影
      const screenshot = await page.screenshot({ fullPage: true });

      // Claude Vision でビジュアルチェック
      const analysis = await this.analyzeScreenshot(screenshot);

      results.push({
        component,
        screenshot,
        analysis,
        passed: analysis.issues.length === 0,
      });

      await page.close();
    }

    return results;
  }

  private async analyzeScreenshot(screenshot: Buffer): Promise<VisualAnalysis> {
    // Claude Vision API でスクリーンショットを解析
    const response = await this.claudeClient.messages.create({
      model: 'claude-sonnet-4.5',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshot.toString('base64'),
              },
            },
            {
              type: 'text',
              text: `このUIスクリーンショットを分析してください：
                - レイアウトの崩れ
                - アクセシビリティの問題
                - デザインシステムからの逸脱
                - パフォーマンスの懸念`,
            },
          ],
        },
      ],
    });

    return this.parseAnalysisResponse(response);
  }
}
```

#### 5.3.2 Evals統合

```typescript
// agent-orchestration/src/evals/promptfoo-config.ts
import { evaluate } from 'promptfoo';

export async function runAgentEvals(): Promise<EvalResults> {
  const results = await evaluate({
    prompts: [
      'Figmaデザインから正確にコンポーネントを生成してください',
      '生成されたコードをレビューしてセキュリティ問題を指摘してください',
      'このコンポーネントのPlaywrightテストを生成してください',
    ],
    providers: [
      { id: 'claude-sonnet-4.5', config: { model: 'claude-sonnet-4.5' } },
    ],
    tests: [
      {
        description: 'コンポーネント生成の正確性',
        vars: { figmaUrl: 'https://figma.com/file/...' },
        assert: [
          { type: 'contains', value: 'export default function' },
          { type: 'javascript', value: 'output.includes("Props")' },
          { type: 'llm-rubric', value: 'コードはTypeScriptで型安全である' },
        ],
      },
      {
        description: 'コードレビューの網羅性',
        vars: { code: '/* generated code */' },
        assert: [
          { type: 'contains', value: 'セキュリティ' },
          { type: 'contains', value: 'パフォーマンス' },
          { type: 'llm-rubric', value: '具体的な改善提案が含まれている' },
        ],
      },
      {
        description: 'テスト生成の品質',
        vars: { component: 'Button' },
        assert: [
          { type: 'contains', value: 'test(' },
          { type: 'contains', value: 'expect(' },
          { type: 'javascript', value: 'output.split("test(").length >= 3' },
          { type: 'llm-rubric', value: 'エッジケースをカバーしている' },
        ],
      },
    ],
    outputPath: './eval-results.json',
  });

  return results;
}
```

---

## 6. AIエージェント機能設計

### 6.1 実装すべきエージェント一覧

| エージェント | 責務 | 主要MCP | 優先度 |
|------------|------|---------|--------|
| **Design Agent** | Figma→コード変換 | Figma, GitHub | 最高 |
| **Code Review Agent** | コード品質・セキュリティレビュー | GitHub | 高 |
| **Test Generation Agent** | テスト自動生成 | Playwright, GitHub | 高 |
| **Task Management Agent** | タスク自動生成・管理 | Linear, GitHub | 中 |
| **Documentation Agent** | ドキュメント自動生成 | GitHub, Notion | 中 |
| **Support Agent** | ユーザーサポートチャットボット | Slack, Linear | 低 |

### 6.2 エージェント間連携フロー

```
User Request
    ↓
┌───┴─────────────────────────────────────────────────────┐
│ Orchestrator Agent (調整役)                              │
└───┬─────────────────────────────────────────────────────┘
    │
    ├─→ Design Agent
    │     ↓
    │   Figma MCP → Builder.io → Generated Code
    │     │
    │     └─→ Code Review Agent
    │           ↓
    │         GitHub MCP → Review Comments
    │           │
    │           └─→ Test Generation Agent
    │                 ↓
    │               Playwright MCP → Test Code
    │                 │
    │                 └─→ Task Management Agent
    │                       ↓
    │                     Linear MCP → Tasks Created
    │                       │
    │                       └─→ GitHub MCP → PR Created
    │
    └─→ Result to User
```

### 6.3 共有コンテキスト管理

```typescript
// agent-orchestration/src/orchestrator/context-manager.ts
export class AgentContextManager {
  private contexts: Map<string, AgentContext> = new Map();

  async createContext(workflowId: string, initialData: any): Promise<string> {
    const contextId = generateId();
    const context: AgentContext = {
      id: contextId,
      workflowId,
      data: initialData,
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contexts.set(contextId, context);
    return contextId;
  }

  async updateContext(
    contextId: string,
    agentId: string,
    update: Partial<AgentContext['data']>
  ): Promise<void> {
    const context = this.contexts.get(contextId);
    if (!context) throw new Error('Context not found');

    context.data = { ...context.data, ...update };
    context.history.push({
      agentId,
      action: 'update',
      data: update,
      timestamp: new Date(),
    });
    context.updatedAt = new Date();

    // Context をRedisに永続化
    await this.redis.set(`context:${contextId}`, JSON.stringify(context));
  }

  async getContext(contextId: string): Promise<AgentContext | null> {
    // メモリにあればそれを返す
    if (this.contexts.has(contextId)) {
      return this.contexts.get(contextId)!;
    }

    // Redisから取得
    const cached = await this.redis.get(`context:${contextId}`);
    if (cached) {
      const context = JSON.parse(cached);
      this.contexts.set(contextId, context);
      return context;
    }

    return null;
  }
}
```

---

## 7. 移行戦略

### 7.1 段階的実装計画（3フェーズ）

#### Phase 1: 基盤構築（1-2ヶ月）

**目標**: 新技術スタックの導入とMCP統合

**タスク:**
- [ ] Next.js 15 + React 19へのアップグレード
- [ ] shadcn/ui導入とコンポーネントライブラリ構築
- [ ] Zustand導入（Context API置き換え）
- [ ] tRPCルーター実装（GraphQLと並行）
- [ ] Claude Agent SDK統合
- [ ] Figma/Linear/Playwright MCP サーバーセットアップ
- [ ] PostgreSQL 16へのアップグレード
- [ ] Qdrant（Vector DB）導入

**成果物:**
- モダンなフロントエンドスタック
- MCP統合基盤
- AIエージェント実行環境

#### Phase 2: AIエージェント実装（2-3ヶ月）

**目標**: コアAIエージェント機能の実装

**タスク:**
- [ ] Design Agent実装（Figma→コード）
- [ ] Code Review Agent実装
- [ ] Test Generation Agent実装（Playwright Test Agents）
- [ ] Task Management Agent実装（Linear連携）
- [ ] エージェント間連携機構
- [ ] Evals framework統合（Promptfoo）
- [ ] Visual Testing統合（Chromatic）

**成果物:**
- 動作するAIエージェント群
- 自動化されたワークフロー
- 品質評価システム

#### Phase 3: スケーラビリティ強化（1-2ヶ月）

**目標**: 本番環境対応とスケーラビリティ確保

**タスク:**
- [ ] Kubernetes環境構築（EKS/GKE）
- [ ] マイクロサービス化（Agent Serviceの分離）
- [ ] API Rate Limiting実装
- [ ] JWT RS256化、OAuth2統合
- [ ] Datadog APM/RUM統合
- [ ] CI/CD強化（ArgoCD GitOps）
- [ ] ドキュメント整備
- [ ] パフォーマンスチューニング

**成果物:**
- 本番環境Ready
- スケーラブルなインフラ
- 包括的な監視体制

### 7.2 リスク管理

| リスク | 影響度 | 発生確率 | 対策 |
|-------|-------|---------|------|
| **Claude Agent SDKの不安定性** | 高 | 中 | OpenAI SDK へのフォールバック実装 |
| **MCP統合の複雑性** | 中 | 中 | 段階的導入、既存API並行運用 |
| **パフォーマンス劣化** | 高 | 低 | ベンチマーク、キャッシング戦略 |
| **トークンコスト増大** | 中 | 高 | Promptfoo でコスト最適化、キャッシング |
| **既存機能の互換性** | 高 | 低 | GraphQL/gRPC維持、並行運用期間 |
| **学習コスト** | 中 | 高 | ドキュメント整備、ハンズオン |

---

## 8. リスクとトレードオフ

### 8.1 技術的トレードオフ

#### Claude Agent SDK vs OpenAI Agents SDK

| 観点 | Claude | OpenAI | 選定 |
|------|--------|--------|------|
| **MCP統合** | ネイティブ | 後付け | ✅ Claude |
| **マルチエージェント** | 自前実装 | Handoffs | ⚠️ 引き分け |
| **日本語対応** | 優秀 | 良好 | ✅ Claude |
| **コスト** | 中 | 中 | 引き分け |
| **実績** | Claude Code | 多数 | ✅ Claude |

**決定**: Claude Agent SDK（MCP統合、日本語、実績）

#### tRPC vs GraphQL vs gRPC

| 観点 | tRPC | GraphQL | gRPC | 選定 |
|------|------|---------|------|------|
| **型安全性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ tRPC |
| **ボイラープレート** | 少 | 多 | 中 | ✅ tRPC |
| **学習コスト** | 低 | 中 | 高 | ✅ tRPC |
| **エコシステム** | 成長中 | 成熟 | 成熟 | ⚠️ GraphQL/gRPC |
| **パフォーマンス** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ gRPC |

**決定**: ハイブリッド（tRPC新規、GraphQL/gRPC既存）

#### Zustand vs Redux Toolkit vs Jotai

| 観点 | Zustand | Redux Toolkit | Jotai | 選定 |
|------|---------|--------------|-------|------|
| **バンドルサイズ** | 1kb | 45kb | 3kb | ✅ Zustand |
| **学習コスト** | 低 | 高 | 中 | ✅ Zustand |
| **React 19対応** | ✅ | ✅ | ✅ | 引き分け |
| **DevTools** | シンプル | 強力 | シンプル | ⚠️ Redux |
| **コード量** | 少 | 多 | 中 | ✅ Zustand |

**決定**: Zustand（軽量、シンプル、十分な機能）

### 8.2 運用上のトレードオフ

#### マイクロサービス vs モノリス

**マイクロサービス化の判断基準:**
- ✅ チームサイズ > 10人
- ✅ トラフィック > 10万req/日
- ✅ 部分的なスケーリングが必要
- ⚠️ 運用複雑性の許容

**推奨**: ハイブリッド（Agent Serviceは分離、他はモノリス維持）

#### Self-Hosted vs Managed Services

| サービス | Self-Hosted | Managed | 選定 |
|---------|-------------|---------|------|
| **PostgreSQL** | EC2/K8s | RDS/Cloud SQL | ✅ Managed |
| **Redis** | K8s | ElastiCache/Memorystore | ✅ Managed |
| **Qdrant** | K8s | Qdrant Cloud | ✅ Managed |
| **Kubernetes** | Self | EKS/GKE | ✅ Managed |
| **CI/CD** | Jenkins | GitHub Actions | ✅ GitHub Actions |

**決定**: Managed Services優先（運用コスト削減）

---

## 9. 推奨事項

### 9.1 即座に着手すべき項目

1. **Next.js 15 + React 19へのアップグレード**
   - 理由: Server Components、Server Actionsの恩恵
   - 影響: フロントエンド全体
   - 期間: 2週間

2. **shadcn/ui導入**
   - 理由: UIコンポーネント標準化、デザインシステム構築
   - 影響: 全UI
   - 期間: 1週間

3. **Claude Agent SDK + MCP統合**
   - 理由: プロジェクトの中核機能
   - 影響: 新機能全体
   - 期間: 4週間

### 9.2 中期的な実装項目

1. **tRPCルーター実装**
   - 理由: 型安全なAPI、開発効率向上
   - 影響: 新規API全体
   - 期間: 3週間

2. **Playwright Test Agents統合**
   - 理由: テスト自動生成、品質向上
   - 影響: テスト全体
   - 期間: 2週間

3. **Figma/Linear MCP実装**
   - 理由: 主要な自動化機能
   - 影響: デザイン→コード、タスク管理
   - 期間: 4週間

### 9.3 長期的な改善項目

1. **マイクロサービス化**
   - 理由: スケーラビリティ、チーム拡大対応
   - 影響: バックエンド全体
   - 期間: 8週間

2. **Kubernetes + ArgoCD**
   - 理由: 本番環境の安定化、GitOps
   - 影響: インフラ全体
   - 期間: 6週間

3. **包括的な監視（Datadog）**
   - 理由: 運用効率化、問題の早期発見
   - 影響: 全レイヤー
   - 期間: 2週間

### 9.4 コスト見積もり

#### 開発コスト

| フェーズ | 期間 | 人月 | 概算コスト（@100万円/人月） |
|---------|------|------|--------------------------|
| Phase 1 | 2ヶ月 | 4人月 | 400万円 |
| Phase 2 | 3ヶ月 | 6人月 | 600万円 |
| Phase 3 | 2ヶ月 | 3人月 | 300万円 |
| **合計** | **7ヶ月** | **13人月** | **1,300万円** |

#### 運用コスト（月額）

| 項目 | サービス | 月額コスト |
|------|---------|----------|
| **AI API** | Claude Sonnet 4.5 (100万トークン/日) | $150 |
| **Compute** | Kubernetes (3ノード) | $300 |
| **Database** | PostgreSQL (RDS/Cloud SQL) | $50 |
| **Cache** | Redis | $30 |
| **Vector DB** | Qdrant Cloud | $50 |
| **Storage** | S3/GCS | $20 |
| **監視** | Datadog | $100 |
| **その他** | GitHub Actions, Vercel等 | $50 |
| **合計** | - | **$750 (~11万円)** |

---

## 10. 結論

### 10.1 アーキテクチャの優位性

新アーキテクチャは以下の優位性を持ちます：

1. **AIファースト**: エージェント層を中核に据えた設計
2. **標準化**: MCP による統一されたツール連携
3. **モダン**: 最新技術スタック（Next.js 15, React 19, Go 1.24）
4. **スケーラブル**: マイクロサービス対応の柔軟な構成
5. **開発者体験**: tRPC、Zustand、shadcn/ui による高いDX
6. **自動化**: デザイン→コード→テスト→デプロイの完全自動化
7. **品質保証**: Evals framework による継続的な品質評価

### 10.2 競合優位性

市場における差別化ポイント：

- ✅ **統合プラットフォーム**: 競合は部分的機能のみ
- ✅ **MCP標準準拠**: 将来の拡張性が高い
- ✅ **オープンソース**: カスタマイズ性とコミュニティ
- ✅ **日本語対応**: Claude Agent SDKの優れた日本語能力
- ✅ **実績ある技術**: Claude Code、Builder.io等の実証済み技術

### 10.3 次のステップ

1. **PdM**: 要件定義書の詳細化
2. **PM**: Phase 1タスクの詳細分解
3. **Tech Lead**: プロトタイプ実装（2週間）
4. **Dev Team**: 技術スタック検証（PoC）
5. **Reviewer**: アーキテクチャレビュー

---

## 付録

### A. 参考リンク

**MCP:**
- [Model Context Protocol 公式](https://docs.anthropic.com/en/docs/build-with-claude/mcp)
- [Figma MCP Server](https://developers.figma.com/docs/figma-mcp-server/)
- [Linear MCP](https://linear.app/docs/mcp)

**AI Agents:**
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/agent-sdk)
- [OpenAI Agents SDK](https://platform.openai.com/docs/agents)
- [Playwright Test Agents](https://playwright.dev/docs/test-agents)

**Next.js/React:**
- [Next.js 15](https://nextjs.org/blog/next-15)
- [React 19](https://react.dev/blog/2024/12/05/react-19)
- [shadcn/ui](https://ui.shadcn.com/)

### B. 用語集

| 用語 | 説明 |
|------|------|
| **MCP** | Model Context Protocol - AIとツールを接続する標準プロトコル |
| **Claude Agent SDK** | Anthropic の AI エージェント開発フレームワーク |
| **Evals** | AI出力の品質を評価するフレームワーク |
| **tRPC** | TypeScript でエンドツーエンド型安全なAPIを構築するフレームワーク |
| **Zustand** | 軽量なReact状態管理ライブラリ |
| **shadcn/ui** | Radix UIベースのコピー&ペーストUIコンポーネント |
| **Playwright Test Agents** | AI駆動のテスト自動生成・修復システム |

---

**ドキュメントバージョン**: 1.0
**最終更新**: 2026-03-29
**次回レビュー**: Phase 1完了後
