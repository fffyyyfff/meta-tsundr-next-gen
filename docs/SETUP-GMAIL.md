# Gmail連携 設定ガイド

Gmailから購入確認メールを自動取得し、購入管理に登録する機能です。

## 1. Google Cloud Console でプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 上部のプロジェクトセレクターから「新しいプロジェクト」をクリック
3. プロジェクト名: `meta-tsundr`（任意）
4. 「作成」をクリック

## 2. Gmail API を有効化

1. 左メニュー「APIとサービス」→「ライブラリ」
2. 「Gmail API」を検索
3. 「有効にする」をクリック

## 3. OAuth 同意画面の設定

1. 左メニュー「APIとサービス」→「OAuth 同意画面」
2. User Type: 「外部」を選択 → 「作成」
3. アプリ情報を入力:
   - アプリ名: `Meta-tsundr`
   - ユーザーサポートメール: 自分のメールアドレス
   - デベロッパー連絡先: 同上
4. 「保存して続行」
5. スコープ追加: `https://www.googleapis.com/auth/gmail.readonly`
6. テストユーザーに自分のGmailアドレスを追加
7. 「保存して続行」

## 4. 認証情報（OAuth クライアントID）の作成

1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類: 「ウェブ アプリケーション」
4. 名前: `Meta-tsundr Web`（任意）
5. 承認済みのリダイレクト URI:
   - 開発: `http://localhost:3000/api/auth/google/callback`
   - 本番: `https://your-domain.com/api/auth/google/callback`
6. 「作成」をクリック
7. 表示される **クライアントID** と **クライアントシークレット** をコピー

## 5. 環境変数の設定

```bash
# .envrc に追加
export GOOGLE_CLIENT_ID=123456789-xxxxxxxx.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx

# 環境変数を反映
direnv allow
```

## 6. 動作確認

1. `task run` でアプリを起動
2. `/purchases` ページを開く
3. ヘッダーの「Gmail連携」ボタンをクリック
4. Googleの認証画面でアカウントを選択・許可
5. リダイレクト後、メールアドレスが表示されれば連携完了
6. 「同期」ボタンで購入確認メールを取得

## トラブルシューティング

### 「アクセスがブロックされました」エラー
- OAuth同意画面でテストユーザーに自分のメールを追加済みか確認
- アプリが「テスト」モードの場合、テストユーザーのみ利用可能

### リダイレクトURIエラー
- 認証情報の「承認済みのリダイレクト URI」に正確なURLが登録されているか確認
- `http://localhost:3000/api/auth/google/callback` （末尾スラッシュなし）

### スコープ不足エラー
- OAuth同意画面で `gmail.readonly` スコープが追加されているか確認
