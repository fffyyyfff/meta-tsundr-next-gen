# 設定管理システム

このパッケージは、積読管理アプリケーションの設定を管理するためのシステムです。環境変数とJSONファイルの両方から設定を読み込み、検証機能も提供します。

## 機能

- 環境変数からの設定読み込み
- JSONファイルからの設定読み込み
- 設定の検証
- デフォルト値の提供
- 機密情報のマスキング
- 複数のプロバイダー対応（Redis/Valkey、AWS S3/GCS）

## 使用方法

### 基本的な使用方法

```go
package main

import (
    "log"
    "github.com/your-org/tsundoku/internal/infrastructure/config"
)

func main() {
    // 環境変数から設定を読み込み
    cfg, err := config.Load()
    if err != nil {
        log.Fatal("設定の読み込みに失敗しました:", err)
    }

    // 設定を表示（機密情報はマスク）
    cfg.PrintConfig()

    // データベース接続文字列を取得
    dsn := cfg.GetDatabaseDSN()
    log.Println("Database DSN:", dsn)
}
```

### JSONファイルからの読み込み

```go
// JSONファイルから設定を読み込み
cfg, err := config.LoadFromFile("config.json")
if err != nil {
    log.Fatal("設定ファイルの読み込みに失敗しました:", err)
}
```

### パニック版（開発時に便利）

```go
// 設定読み込みに失敗した場合はパニック
cfg := config.MustLoad()
```

## 設定項目

### サーバー設定

- `HTTP_PORT`: HTTPサーバーのポート番号（デフォルト: 8080）
- `GRPC_PORT`: gRPCサーバーのポート番号（デフォルト: 50051）
- `ENVIRONMENT`: 実行環境（development/staging/production）
- `SERVER_TIMEOUT`: サーバータイムアウト（デフォルト: 30s）

### データベース設定

- `DB_HOST`: データベースホスト（デフォルト: localhost）
- `DB_PORT`: データベースポート（デフォルト: 5432）
- `DB_USER`: データベースユーザー（デフォルト: postgres）
- `DB_PASSWORD`: データベースパスワード
- `DB_NAME`: データベース名（デフォルト: tsundoku）
- `DB_SSL_MODE`: SSL モード（デフォルト: disable）
- `DB_MAX_OPEN_CONNS`: 最大接続数（デフォルト: 25）
- `DB_MAX_IDLE_CONNS`: 最大アイドル接続数（デフォルト: 5）
- `DB_CONN_MAX_LIFETIME`: 接続の最大生存時間（デフォルト: 5m）

### Redis設定

- `REDIS_HOST`: Redisホスト（デフォルト: localhost）
- `REDIS_PORT`: Redisポート（デフォルト: 6379）
- `REDIS_PASSWORD`: Redisパスワード
- `REDIS_DB`: Redisデータベース番号（デフォルト: 0）
- `REDIS_POOL_SIZE`: プールサイズ（デフォルト: 10）
- `REDIS_MIN_IDLE_CONNS`: 最小アイドル接続数（デフォルト: 2）
- `CACHE_PROVIDER`: キャッシュプロバイダー（redis/valkey）

### JWT設定

- `JWT_SECRET`: JWTシークレットキー（32文字以上必須）
- `JWT_EXPIRATION`: JWT有効期限（デフォルト: 24h）
- `JWT_ISSUER`: JWT発行者（デフォルト: tsundoku-app）

### ストレージ設定

- `STORAGE_PROVIDER`: ストレージプロバイダー（s3/gcs）

#### AWS S3設定
- `AWS_REGION`: AWSリージョン
- `AWS_S3_BUCKET`: S3バケット名
- `AWS_ACCESS_KEY_ID`: AWSアクセスキー
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットキー

#### Google Cloud Storage設定
- `GCP_PROJECT_ID`: GCPプロジェクトID
- `GCS_BUCKET`: GCSバケット名
- `GOOGLE_APPLICATION_CREDENTIALS`: サービスアカウントキーのパス

### 外部API設定

#### 楽天ブックスAPI
- `RAKUTEN_BOOKS_API_KEY`: 楽天ブックスAPIキー
- `RAKUTEN_BOOKS_BASE_URL`: 楽天ブックスAPIのベースURL

#### SendGrid
- `SENDGRID_API_KEY`: SendGrid APIキー
- `SENDGRID_FROM_NAME`: 送信者名
- `SENDGRID_FROM_MAIL`: 送信者メールアドレス

#### Datadog
- `DATADOG_API_KEY`: Datadog APIキー
- `DATADOG_APP_KEY`: Datadog アプリケーションキー
- `DATADOG_SITE`: Datadogサイト

### ログ設定

- `LOG_LEVEL`: ログレベル（debug/info/warn/error/fatal）
- `LOG_FORMAT`: ログフォーマット（json/text）

## 設定ファイル

### 環境変数ファイル

`.env`ファイルを使用して環境変数を設定できます：

```bash
# .env
HTTP_PORT=8080
GRPC_PORT=50051
ENVIRONMENT=development
DB_HOST=localhost
DB_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```

### JSONファイル

`config.json`ファイルを使用して設定を管理することもできます：

```json
{
  "server": {
    "http_port": 8080,
    "grpc_port": 50051,
    "environment": "development"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "password",
    "db_name": "tsundoku"
  }
}
```

## 検証

設定は自動的に検証され、以下のような問題がある場合はエラーが返されます：

- ポート番号が範囲外
- 必須項目の不足
- JWTシークレットが短すぎる
- 無効な環境名
- 無効なプロバイダー名

## セキュリティ

機密情報（パスワード、APIキーなど）は以下の方法で保護されます：

- 設定表示時の自動マスキング
- ログ出力時の機密情報除外
- 本番環境での適切な環境変数管理

## ファイル構成

このパッケージは責任分離の原則に従って、以下の構成で実装されています：

```
internal/infrastructure/config/
├── config.go               # 基本構造体の定義
├── config_test.go          # 基本構造体のテスト
├── loader.go               # 設定読み込み機能
├── loader_test.go          # 読み込み機能のテスト
├── validator.go            # 設定検証機能
├── validator_test.go       # 検証機能のテスト
├── helper.go               # ヘルパー機能
├── helper_test.go          # ヘルパー機能のテスト
└── README.md               # このファイル
```

### 重要な設計原則

**各ファイルは独立した責任を持ち、テストファイルも対応する機能のみをテストします。**

- `config_test.go`: 基本構造体の初期化とフィールドアクセスのみをテスト
- `loader_test.go`: 環境変数やファイルからの読み込み機能のみをテスト
- `validator_test.go`: 設定値の検証機能のみをテスト
- `helper_test.go`: ヘルパーメソッドと機密情報マスキング機能のみをテスト

**禁止事項：**
- テスト間での機能の重複
- 一つのテストファイルが他のファイルの責任範囲をテストすること
- 重複を理由に他のテストファイルを削除すること

## テスト

```bash
go test ./internal/infrastructure/config
```

各テストファイルは以下の項目を検証します：

- **config_test.go**: 構造体の基本的な初期化とフィールドアクセス
- **loader_test.go**: 環境変数からの読み込み、デフォルト値の適用、ファイルからの読み込み
- **validator_test.go**: 設定値の妥当性検証、エラーケースの処理
- **helper_test.go**: 環境判定、DSN生成、アドレス生成、機密情報のマスキング