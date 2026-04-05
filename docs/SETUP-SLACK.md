# Slack 連携セットアップガイド

## 概要

本を「読了」にすると、Slack チャンネルに自動通知されます。

```
📚 読了しました！
リーダブルコード
著者: Dustin Boswell
★★★★★
2026-04-05
```

---

## Step 1: Slack Incoming Webhook の作成

### 1-1. Slack App を作成

1. [Slack API](https://api.slack.com/apps) にアクセス
2. 「**Create New App**」をクリック
3. 「**From scratch**」を選択
4. App Name: `Meta-tsundr`
5. ワークスペースを選択
6. 「**Create App**」

### 1-2. Incoming Webhook を有効化

1. 左メニュー「**Incoming Webhooks**」をクリック
2. 「**Activate Incoming Webhooks**」を **On** に切替
3. 「**Add New Webhook to Workspace**」をクリック
4. 投稿先チャンネルを選択（例: `#books` や `#general`）
5. 「**Allow**」をクリック
6. 表示される **Webhook URL** をコピー

```
https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Step 2: 環境変数に設定

```bash
vi .envrc
```

以下を追加：

```bash
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

有効化：

```bash
direnv allow
```

---

## Step 3: 動作確認

```bash
task run
```

1. http://localhost:3000/books にアクセス
2. 本の3点メニュー → ステータス変更 → 「読了」
3. Slack の指定チャンネルに通知が届く

---

## 通知の種類

| イベント | 通知内容 |
|---------|---------|
| **読了** | 書籍名、著者、評価、読了日 |
| **Gmail 同期** | 取得した購入件数 |
| **週次レポート**（将来） | 今週の読書統計 |

---

## トラブルシューティング

### 通知が届かない

```bash
# Webhook URL が設定されているか確認
echo $SLACK_WEBHOOK_URL

# テスト送信
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Meta-tsundr テスト通知"}' \
  $SLACK_WEBHOOK_URL
```

### 「channel_not_found」エラー

Webhook 作成時に選択したチャンネルが削除された可能性。Step 1-2 を再実行してください。

### 通知のフォーマットを変更したい

`src/server/services/slack-templates.ts` を編集してください。
