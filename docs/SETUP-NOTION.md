# Notion連携 セットアップガイド

## 概要

読了した書籍の読書ノートを Notion に自動作成する機能。
AI (Claude Haiku) が書評テンプレートを生成し、書影付きの Notion ページを作成します。

---

## 1. Notion Integration 作成

1. [My Integrations](https://www.notion.so/my-integrations) にアクセス
2. 「New integration」をクリック
3. 設定:
   - **Name**: `Meta-tsundr`
   - **Associated workspace**: 使用するワークスペースを選択
   - **Capabilities**: Read content, Insert content, Update content にチェック
4. 「Submit」で作成
5. **Internal Integration Secret** をコピー → これが `NOTION_API_KEY`

## 2. データベース作成

Notion で読書管理用データベースを作成します。

### 必要なプロパティ

| プロパティ名 | タイプ | 説明 |
|-------------|--------|------|
| Name | Title | 書籍タイトル (自動設定) |
| Author | Rich text | 著者名 |
| Status | Select | UNREAD / READING / FINISHED |
| Rating | Number | 評価 (1-5) |
| Finished Date | Date | 読了日 |
| ISBN | Rich text | ISBN |

### データベースID取得

1. Notion でデータベースページを開く
2. URL をコピー: `https://www.notion.so/{workspace}/{database_id}?v=...`
3. `database_id` 部分 (32文字のハイフンなし文字列) → これが `NOTION_DATABASE_ID`

例: `https://www.notion.so/myworkspace/abc123def456...` → `abc123def456...`

## 3. ページ共有設定

**重要**: Integration がデータベースにアクセスするには共有設定が必要です。

1. データベースページを開く
2. 右上の「...」メニュー → 「Connections」
3. 「Connect to」で先ほど作成した `Meta-tsundr` を選択
4. 「Confirm」

## 4. 環境変数設定

```bash
# .envrc に追加
export NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxx
export NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 5. 動作確認

### 自動作成 (読了時)
1. 書籍詳細ページでステータスを「読了」に変更
2. Notion データベースに読書ノートが自動作成される

### 手動作成
1. 読了済み書籍の詳細ページを開く
2. 「Notionにノート作成」ボタンをクリック
3. 作成後、Notion ページへのリンクが表示される

### 積読リスト同期
tRPC mutation `book.syncToNotion` で全書籍をデータベースに同期可能。

## 6. トラブルシューティング

| 問題 | 対処 |
|------|------|
| 「Notion連携が設定されていません」 | NOTION_API_KEY と NOTION_DATABASE_ID を確認 |
| 403 エラー | データベースの共有設定で Integration を追加 |
| データベースが見つからない | NOTION_DATABASE_ID が正しいか確認（ハイフンなし32文字） |
| ページ作成されるが内容が空 | ANTHROPIC_API_KEY を確認（AI生成に必要） |

## 7. 未設定時の動作

`NOTION_API_KEY` が未設定の場合、全ての Notion 関連機能はスキップされます。
アプリの他の機能に影響はありません (graceful degradation)。
