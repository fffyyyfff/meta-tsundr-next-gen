# API Reference - Meta-tsundr Next Gen

## tRPC ルーター一覧

全ルーターは `src/server/routers/_app.ts` で統合。
クライアントからは `trpcReact.{router}.{procedure}` でアクセス。

---

### book (積読管理)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `list` | Query | `{ status?, search?, sortBy?, sortOrder?, limit?, cursor? }` | 書籍一覧 |
| `getById` | Query | `{ id }` | 書籍詳細 |
| `create` | Mutation | `{ title, author, isbn?, status?, imageUrl?, notes?, rating? }` | 書籍作成 |
| `update` | Mutation | `{ id, title?, author?, isbn?, status?, imageUrl?, notes?, rating? }` | 書籍更新 |
| `delete` | Mutation | `{ id }` | ソフトデリート |
| `restore` | Mutation | `{ id }` | リストア |
| `changeStatus` | Mutation | `{ id, status }` | ステータス変更 |
| `stats` | Query | - | 読書統計 |
| `readingAnalytics` | Query | - | 読書分析データ |
| `lookupIsbn` | Query | `{ isbn }` | ISBN検索 |
| `searchExternal` | Query | `{ title, availability?, sort? }` | 楽天ブックス検索 |
| `getAiRecommendation` | Mutation | - | AIおすすめ生成 |
| `generateReview` | Mutation | `{ bookId }` | AI書評生成 |
| `createReadingPlan` | Mutation | - | AI読書計画生成 |

**BookStatus:** `WISHLIST` | `UNREAD` | `READING` | `FINISHED`

---

### item (購入管理)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `list` | Query | `{ category?, status?, source?, search?, sortBy?, sortOrder?, limit?, cursor? }` | アイテム一覧 |
| `getById` | Query | `{ id }` | アイテム詳細 |
| `create` | Mutation | `{ title, category, creator?, status?, imageUrl?, price?, purchaseDate?, source?, productUrl?, notes?, rating?, metadata? }` | アイテム作成 |
| `update` | Mutation | `{ id, ... }` | アイテム更新 |
| `delete` | Mutation | `{ id }` | ソフトデリート |
| `restore` | Mutation | `{ id }` | リストア |
| `changeStatus` | Mutation | `{ id, status }` | ステータス変更 |
| `stats` | Query | - | 購入統計 |
| `searchProduct` | Query | `{ keyword, source?: 'amazon'\|'rakuten'\|'auto' }` | 商品検索 |
| `enrichImage` | Mutation | `{ id }` | 画像エンリッチ (単体) |
| `enrichAllImages` | Mutation | - | 画像エンリッチ (一括) |
| `scanReceipt` | Mutation | `{ image, mimeType, mode?: 'ai'\|'ocr' }` | レシートスキャン |
| `voiceRegister` | Mutation | `{ transcript }` | 音声入力による商品登録 |
| `checkPrices` | Mutation | `{ userId? }` | ウィッシュリスト価格チェック |

**ItemCategory:** `BOOK` | `ELECTRONICS` | `DAILY_GOODS` | `FOOD` | `CLOTHING` | `HOBBY` | `OTHER`
**ItemStatus:** `WISHLIST` | `PURCHASED` | `IN_USE` | `COMPLETED` | `RETURNED`

---

### gmail (Gmail連携)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `getStatus` | Query | - | 接続状態取得 |
| `preview` | Mutation | - | 購入メールプレビュー |
| `confirm` | Mutation | `{ items: PreviewItem[] }` | 選択アイテム確認・保存 |
| `disconnect` | Mutation | - | Gmail連携解除 |

---

### notification (通知)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `listNotifications` | Query | `{ userId, unreadOnly?, limit? }` | 通知一覧 |
| `markAsRead` | Mutation | `{ notificationIds }` | 既読マーク |
| `configureWebhook` | Mutation | `{ userId, slackUrl?, events, enabled }` | Webhook設定 |

---

### agent (AIエージェント)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `executeTask` | Mutation | `{ task, agentType, userId, projectId? }` | タスク実行 |
| `executeWorkflow` | Mutation | `{ task, workflow, steps? }` | ワークフロー実行 |
| `listAgents` | Query | - | エージェント一覧 |

**AgentType:** `design` | `code-review` | `test-gen` | `task-mgmt`

---

### export (エクスポート)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `exportAsJson` | Query | `{ userId, agentType?, status?, from?, to? }` | JSON出力 |
| `exportAsMarkdown` | Query | (同上) | Markdown出力 |
| `exportAsCsv` | Query | (同上) | CSV出力 |

---

### history (実行履歴)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `listExecutions` | Query | `{ userId, projectId?, agentType?, status?, limit?, page?, cursor? }` | 実行一覧 |
| `getExecution` | Query | `{ id }` | 実行詳細 |

---

### usage (使用量)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `getUsageSummary` | Query | `{ period: 'day'\|'week'\|'month' }` | 使用量サマリー |
| `getUsageHistory` | Query | `{ period }` | 使用量履歴 |
| `getCurrentCost` | Query | - | 現在コスト |

---

### figma (Figma連携)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `fetchDesign` | Query | `{ figmaUrl }` | デザイン取得 |
| `generateCode` | Mutation | `{ figmaUrl, componentId }` | コード生成 (単体) |
| `generateAllComponents` | Mutation | `{ figmaUrl }` | コード生成 (全体) |

---

### linear (Linear連携)

| プロシージャ | Type | Input | 説明 |
|-------------|------|-------|------|
| `listIssues` | Query | `{ teamId?, projectId?, limit? }` | Issue一覧 |
| `getIssue` | Query | `{ id }` | Issue詳細 |
| `createIssue` | Mutation | `{ title, description?, teamId, projectId?, priority?, labelIds? }` | Issue作成 |
| `updateIssue` | Mutation | `{ id, title?, description?, stateId?, priority? }` | Issue更新 |
| `syncIssues` | Mutation | `{ teamId }` | Issue同期 |

---

## REST API

| エンドポイント | Method | 説明 |
|---------------|--------|------|
| `/api/health` | GET | ヘルスチェック (`{ status, version, uptime, checks }`) |
| `/api/auth/google` | GET | Google OAuth2 開始 (リダイレクト) |
| `/api/auth/[...action]` | GET/POST | 認証アクション |
| `/api/gmail/callback` | GET | Gmail OAuth2 コールバック |
| `/api/agent/stream` | POST | エージェント ストリーミング実行 (SSE) |
| `/api/og/book/[id]` | GET | OGP画像生成 (書籍) |
| `/api/test-error` | GET | Sentry動作確認用テストエラー |
| `/api/trpc/[trpc]` | GET/POST | tRPC エンドポイント (全ルーター) |
