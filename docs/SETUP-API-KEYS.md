# API キー設定ガイド

## 楽天ブックスAPI（書籍検索・書影取得に必要）

### 1. 楽天アプリIDを取得

1. [Rakuten Developers](https://webservice.rakuten.co.jp/) にアクセス
2. 「アプリID発行」をクリック
3. 楽天会員でログイン（未登録なら新規登録）
4. アプリ情報を入力：
   - アプリ名: `Meta-tsundr`（任意）
   - アプリURL: `http://localhost:3000`（開発用）
5. 発行された **アプリID（applicationId）** をコピー

### 2. 環境変数に設定

```bash
# .env.local を編集
cd /Users/user/workspace/AI_work/meta-tsundr-next-gen
```

`.env.local` の該当行を変更：

```
# Before
RAKUTEN_APP_ID=your_rakuten_app_id_here

# After（あなたのアプリIDに置き換え）
RAKUTEN_APP_ID=1234567890abcdef
```

### 3. サーバー再起動

```bash
# Ctrl+C で停止してから
task run
```

### 4. 動作確認

1. http://localhost:3000/books にアクセス
2. 「+ 追加」ボタンをクリック
3. タイトル欄に「リーダブルコード」と入力
4. 候補リストに書影画像付きで候補が表示されれば成功

---

## その他のAPIキー（オプション）

### Anthropic API（AIエージェント機能に必要）

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

取得: [Anthropic Console](https://console.anthropic.com/)
用途: AIおすすめ、書評生成、読書計画

### Figma API（デザイン連携に必要）

```
FIGMA_ACCESS_TOKEN=figd_xxxxx
```

取得: Figma → Settings → Personal Access Tokens

### Linear API（タスク管理連携に必要）

```
LINEAR_API_KEY=lin_api_xxxxx
```

取得: Linear → Settings → API

### GitHub OAuth（ログイン機能に必要）

```
GITHUB_CLIENT_ID=Iv1_xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

取得: GitHub → Settings → Developer settings → OAuth Apps → New

---

## 全環境変数一覧

```bash
# 必須（書籍検索）
RAKUTEN_APP_ID=your_rakuten_app_id_here

# オプション（AI機能）
ANTHROPIC_API_KEY=your_api_key_here

# オプション（デザイン連携）
FIGMA_ACCESS_TOKEN=your_figma_token_here

# オプション（タスク管理）
LINEAR_API_KEY=your_linear_api_key_here

# オプション（認証）
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# インフラ（Docker使用時）
DATABASE_URL="postgresql://meta_tsundr:meta_tsundr_dev@localhost:5432/meta_tsundr"
QDRANT_URL=http://localhost:6333
GRPC_BACKEND_URL=http://localhost:50051

# セキュリティ
JWT_SECRET=your-jwt-secret-at-least-32-characters
```
