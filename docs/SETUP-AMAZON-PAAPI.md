# Amazon Product Advertising API (PA-API 5.0) セットアップガイド

## 概要

Amazon PA-API を使うと、商品検索・詳細取得・画像取得・価格取得が可能になります。
Meta-tsundr の購入管理機能で Amazon 商品を画像付きで検索・登録できるようになります。

---

## Step 1: Amazon アソシエイトアカウント登録

### 1-1. アソシエイト・セントラルにアクセス

https://affiliate.amazon.co.jp/

### 1-2. サインアップ

1. 既存の Amazon アカウントでログイン（なければ新規作成）
2. 「無料アカウントを作成」をクリック
3. 以下の情報を入力：
   - **アカウント情報**: 氏名、住所、電話番号
   - **ウェブサイト/アプリ情報**: ブログやアプリの URL
     - 個人開発アプリの場合: GitHub リポジトリ URL でも可
     - 例: `https://github.com/fffyyyfff/meta-tsundr-next-gen`
   - **プロフィール**: サイトの説明、カテゴリ、集客方法
   - **トラフィックと収益化**: アクセス数の目安（少なくてOK）
4. アソシエイト ID（パートナータグ）が発行される
   - 例: `fffyyyfff-22`

### 1-3. 審査について

- **仮承認**: 登録直後に仮承認されPA-APIが使用可能
- **本審査**: **180日以内に3件以上の適格な売上**が必要
- 売上がない場合: アカウントが閉鎖され PA-API アクセスが無効化
- **対策**: ブログや SNS でアフィリエイトリンクを1-2本紹介すればOK

---

## Step 2: PA-API アクセスキー取得

### 2-1. 認証情報の発行

1. [アソシエイト・セントラル](https://affiliate.amazon.co.jp/) にログイン
2. 上部メニュー「ツール」→「Product Advertising API」をクリック
3. 「認証情報を追加する」をクリック
4. 以下が発行される：
   - **アクセスキー（Access Key）**: `AKIAIOSFODNN7EXAMPLE`
   - **シークレットキー（Secret Key）**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

> **重要**: シークレットキーは発行時のみ表示されます。必ずコピーして保存してください。

### 2-2. パートナータグの確認

- アソシエイト・セントラルのダッシュボード右上に表示
- 例: `fffyyyfff-22`
- 日本のマーケットプレイス用

---

## Step 3: 環境変数の設定

### 3-1. .envrc に追加

```bash
vi .envrc
```

以下を追加：

```bash
# Amazon Product Advertising API
export AMAZON_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
export AMAZON_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AMAZON_PARTNER_TAG=fffyyyfff-22
```

### 3-2. 有効化

```bash
direnv allow
echo $AMAZON_ACCESS_KEY  # 値が表示されればOK
```

---

## Step 4: アプリで確認

```bash
task run
```

1. http://localhost:3000/purchases/new にアクセス
2. タイトル欄に商品名を入力
3. Amazon の商品が候補に表示されれば成功

---

## API 仕様メモ

### エンドポイント（日本）

```
https://webservices.amazon.co.jp/paapi5/searchitems
https://webservices.amazon.co.jp/paapi5/getitems
```

### 認証方式

- AWS Signature Version 4（HMAC-SHA256）
- リクエストヘッダーに署名を含める

### 主要オペレーション

| オペレーション | 用途 |
|-------------|------|
| `SearchItems` | キーワードで商品検索 |
| `GetItems` | ASIN で商品詳細取得 |
| `GetBrowseNodes` | カテゴリツリー取得 |

### レスポンスで取得できる情報

| リソース | 内容 |
|---------|------|
| `ItemInfo.Title` | 商品タイトル |
| `ItemInfo.ByLineInfo` | メーカー/著者/ブランド |
| `Images.Primary` | メイン画像（Small/Medium/Large） |
| `Offers.Listings.Price` | 価格 |
| `DetailPageURL` | 商品ページURL |
| `ItemInfo.ExternalIds` | ISBN/EAN/UPC |

### レートリミット

| 売上実績 | リクエスト上限 |
|---------|-------------|
| 初期（売上なし） | 1リクエスト/秒 |
| 売上あり | 売上に応じて増加（最大10/秒） |

### 料金

**完全無料**。ただしアソシエイトプログラムの規約に従う必要がある。

---

## トラブルシューティング

### 「TooManyRequests」エラー

レートリミット超過。リクエスト間隔を1秒以上空ける。

### 「InvalidAssociate」エラー

パートナータグが無効。アソシエイト・セントラルでタグを確認。

### 「AccountDenied」エラー

180日以内に売上がなく、アカウントが停止された。再登録が必要。

---

## 参考リンク

- [Amazon アソシエイト・セントラル](https://affiliate.amazon.co.jp/)
- [PA-API 5.0 ドキュメント](https://webservices.amazon.co.jp/paapi5/documentation/)
- [PA-API 5.0 SDK（Node.js）](https://www.npmjs.com/package/amazon-paapi)
- [SearchItems API リファレンス](https://webservices.amazon.co.jp/paapi5/documentation/search-items.html)
