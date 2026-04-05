# 企画書: 外部サービス自律連携（Slack / Notion / Linear / Figma）

## エグゼクティブサマリー

Meta-tsundr に Slack / Notion / Linear / Figma との自律連携機能を追加する。Claude Agent SDK + MCP ハイブリッドアーキテクチャにより、AIエージェントが外部サービスを横断的に操作し、ユーザーの購入・読書管理をシームレスに支援する。

---

## 1. 現状分析

### 実装済みの連携

| サービス | 実装状況 | 方式 | 双方向 |
|---------|---------|------|--------|
| **Figma** | 85%（REST API） | 内部サービスラッパー | 読み取りのみ |
| **Linear** | 60%（GraphQL） | 内部サービスラッパー | Issue CRUD |
| **Slack** | 40%（Webhook のみ） | Incoming Webhook | 送信のみ |
| **Notion** | 0% | 未実装 | — |
| **Gmail** | 100% | OAuth + REST API | 読み取り |

### Agent/MCP インフラ

| コンポーネント | 状態 |
|-------------|------|
| Claude Agent SDK (@anthropic-ai/sdk) | ✅ 実装済み |
| Agent Orchestrator | ✅ 実装済み（マルチエージェント対応） |
| Python Agent Service (gRPC) | ✅ 実装済み（port 50052） |
| MCP プロトコルサーバー | ❌ **未実装**（内部サービスラッパーのみ） |

---

## 2. 技術選定: Agent SDK + MCP ハイブリッド（推奨）

### なぜハイブリッドか

```
Agent SDK だけ: エージェントは自律的に動くが、外部サービスへの接続を全て自前実装
MCP だけ:       ツール呼び出しはできるが、自律的な判断・ワークフローチェーンが弱い
ハイブリッド:    Agent SDK がオーケストレーション + MCP が外部接続 = 最強
```

### 2026年のドミナントパターン

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "今月の購入を分析して、Notionにレポート作成、Slackに共有して",
  options: {
    mcpServers: {
      slack:  { type: "http", url: "https://slack-mcp.example.com/mcp" },
      notion: { type: "http", url: "https://notion-mcp.example.com/mcp" },
      linear: { type: "http", url: "https://mcp.linear.app/mcp" },
    }
  }
})) { /* stream results */ }
```

---

## 3. 各サービスの連携設計

### 3.1 Slack 連携

**ユーザーに刺さるシナリオ:**
- 📚 読了通知: 「リーダブルコード 読了しました！★★★★★」を #books チャンネルに自動投稿
- 🛒 購入アラート: 「ウィッシュリストの商品が30%値下げ！」を DM で通知
- 📊 週次レポート: 「今週の読書: 2冊読了、3冊追加、積読残: 15冊」を自動投稿
- 🤖 Slack からの操作: `/tsundoku 追加 リーダブルコード` でSlack上から書籍登録

**実装方式:**

| 機能 | 方式 | 理由 |
|------|------|------|
| 通知送信 | **Slack MCP** | AIエージェントからの自然な呼び出し |
| インタラクティブ操作 | **Slack Bolt SDK** | ボタン/モーダル対応 |
| イベント受信 | **Socket Mode** | Webhook URL不要、開発が楽 |

**フェーズ:**
- Phase 1: MCP で通知送信（読了/購入/値下げ）
- Phase 2: Bolt SDK でスラッシュコマンド `/tsundoku`
- Phase 3: Socket Mode でリアルタイム双方向

### 3.2 Notion 連携

**ユーザーに刺さるシナリオ:**
- 📖 読書ノート: 読了した本のメモ・書評をNotionページに自動作成
- 📋 積読データベース: Notionデータベースと積読リストを双方向同期
- 📊 月次レポート: 読書統計をNotionページとして自動生成
- 🔍 ナレッジベース: 読了書籍の要点をNotionに蓄積 → 検索可能に

**実装方式:**

| 機能 | 方式 | 理由 |
|------|------|------|
| 読書ノート作成 | **Notion MCP** | AIエージェントが構造化ページを生成 |
| データベース同期 | **Notion REST API** | Push型定期同期（MCP は Pull 向き） |
| 検索・参照 | **Notion MCP** | AI が自然言語でクエリ |

**2層アプローチ（推奨）:**
- **Push層**: アプリ → Notion API（定期同期 / Webhook）
- **Pull層**: Notion MCP → AIエージェント（情報取得・分析）

### 3.3 Linear 連携

**ユーザーに刺さるシナリオ:**
- 🐛 バグ報告自動化: アプリのエラーから Linear Issue を自動作成
- 📝 開発タスク分解: 「購入管理にフィルター追加して」→ AI が Issue に分解
- 📊 スプリント連携: Linear のスプリント進捗を Meta-tsundr ダッシュボードに表示
- 🔄 ステータス同期: Linear の Issue ステータス変更をアプリに反映

**実装方式: MCP 優先（Linear 公式推奨）**

既存の `linear-mcp.ts`（GraphQL ラッパー）を Linear 公式 MCP に置き換え。

```
旧: Next.js → linear-mcp.ts → Linear GraphQL API
新: Next.js → Agent SDK → Linear MCP Server (mcp.linear.app/mcp)
```

### 3.4 Figma 連携

**ユーザーに刺さるシナリオ:**
- 🎨 コード→Figma: 実装済みUIをFigmaフレームに逆変換（**Code to Canvas**）
- 📐 デザイントークン同期: Figmaの色/フォント変更をアプリに自動反映
- 🧩 コンポーネントカタログ: UIコンポーネントをFigmaライブラリとして管理
- 🔄 デザインレビュー: AIがFigmaデザインとコード実装の差分を検出

**コード→Figma 逆輸入の実現可能性:**

✅ **可能。** Figma MCP の「Code to Canvas」機能で実現:
- ブラウザ上の動作するUIをキャプチャ → 編集可能なFigmaフレームに変換
- `use_figma` ツールでネイティブFigma構造を生成
- **html.to.design** よりも高品質（デザインシステム準拠の出力）

**ただし制限:**
- Figma MCP は2026年3月時点でオープンベータ
- Starter プランは月6ツールコールまで
- MCPクライアントの登録が必要（Figma MCP Catalog）
- 大きなページの変換は時間がかかる

**実用性判定: ★★★☆☆（将来的に有望だが現時点ではベータ）**

html.to.design の方が現時点では確実。Figma MCP は「AIエージェントがデザインを読み書きする」ユースケースで差別化される。

---

## 4. フェーズ分解

### Phase 1: Slack 通知 + Notion 読書ノート（2週間）

**最も刺さる:** ユーザーが読了した瞬間にSlackに投稿＋Notionにノートが作られる

| タスク | 方式 | 工数 |
|--------|------|------|
| Slack MCP 接続設定 | リモートMCPサーバー | 2日 |
| 読了時 Slack 通知 | Agent SDK + Slack MCP | 2日 |
| Notion MCP 接続設定 | リモートMCPサーバー | 2日 |
| 読書ノート自動作成 | Agent SDK + Notion MCP | 3日 |
| UI: 連携設定画面 | Next.js ページ | 2日 |

### Phase 2: Linear MCP 移行 + Figma MCP 検証（2週間）

| タスク | 方式 | 工数 |
|--------|------|------|
| Linear MCP 公式サーバー接続 | リモートMCP | 2日 |
| 既存 linear-mcp.ts 置換 | コードリファクタ | 3日 |
| Figma MCP 接続 + Code to Canvas テスト | リモートMCP | 3日 |
| デザイントークン同期 | Figma MCP | 2日 |

### Phase 3: 自律連携ワークフロー（2週間）

Agent SDK + 全 MCP サーバーの統合ワークフロー：

```
ユーザー: 「今月の読書をまとめて」
  → Agent SDK がオーケストレーション
    → 積読DB から読了書籍を取得
    → Notion MCP で月次レポートページ作成
    → Slack MCP で #books チャンネルに投稿
    → Linear MCP で「来月の読書目標」Issue 作成
```

### Phase 4: Slack Bot + インタラクティブ（3週間）

| タスク | 方式 | 工数 |
|--------|------|------|
| Slack Bolt SDK 統合 | Node.js サービス | 5日 |
| スラッシュコマンド `/tsundoku` | Bolt | 3日 |
| インタラクティブメッセージ（ボタン） | Bolt | 3日 |
| Socket Mode 常駐 | Docker サービス | 2日 |

---

## 5. アーキテクチャ

### 最終形

```
┌─────────────────────────────────────────────┐
│            Meta-tsundr (Next.js BFF)         │
│                                              │
│  tRPC Router → Agent Orchestrator            │
│                    │                         │
│              Claude Agent SDK                │
│                    │                         │
│    ┌───────────────┼───────────────┐         │
│    │               │               │         │
│  Slack MCP    Notion MCP     Linear MCP      │
│  (remote)     (remote)       (remote)        │
│    │               │               │         │
│    ▼               ▼               ▼         │
│  Slack API    Notion API     Linear API      │
│                                              │
│         Figma MCP (remote)                   │
│              │                               │
│              ▼                               │
│         Figma API                            │
└──────────────┬───────────────────────────────┘
               │ gRPC
     ┌─────────┼─────────┐
     ▼                   ▼
  Go Backend       Python Agent
  (port 50051)     (port 50052)
```

### MCP サーバーはリモート（ホスティング済み）

全て公式リモートサーバーを利用。自前でMCPサーバーを立てる必要なし：

| サービス | MCP エンドポイント |
|---------|------------------|
| Slack | Slack 公式リモート |
| Notion | `https://mcp.notion.so/mcp` |
| Linear | `https://mcp.linear.app/mcp` |
| Figma | `https://mcp.figma.com/mcp` |

---

## 6. セットアップ要件（ユーザー側）

| サービス | 必要なもの | 費用 |
|---------|-----------|------|
| **Slack** | Slack ワークスペース + OAuth認証 | 無料 |
| **Notion** | Notion アカウント + OAuth認証 | 無料 |
| **Linear** | Linear アカウント + OAuth認証 | 無料（個人） |
| **Figma** | Figma アカウント + MCP Catalog 登録 | 無料（ベータ） |

---

## 7. KPI

| 指標 | Phase 1 後 | Phase 3 後 |
|------|-----------|-----------|
| Slack 通知送信数/月 | 50+ | 200+ |
| Notion ノート自動作成数/月 | 10+ | 50+ |
| Linear Issue 自動作成数/月 | — | 20+ |
| ユーザー満足度（NPS） | +10 | +20 |
| 自律ワークフロー実行数/月 | — | 30+ |

---

## 8. リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| MCP ベータの不安定さ | サービス停止 | API 直接呼び出しへのフォールバック |
| OAuth トークン期限切れ | 連携切断 | リフレッシュトークン + UI で再認証案内 |
| Figma MCP の制限 | 月6コール制限 | html.to.design との併用 |
| Slack Socket Mode の常駐 | サーバーリソース | Docker サービスとして分離 |
| AI コスト増加 | 運用費 | Agent SDK のキャッシュ + Haiku 使い分け |

---

## 9. 結論

**Agent SDK + MCP ハイブリッド** が最適。理由：

1. **公式 MCP サーバーが全サービスで利用可能**（2025-2026年に成熟）
2. **Agent SDK で自律ワークフロー**が実現可能
3. **既存の Agent Orchestrator を拡張**するだけで統合可能
4. **リモート MCP サーバーで運用コストゼロ**
5. **Figma の Code to Canvas は将来的に有望**（現時点は html.to.design で代替）
