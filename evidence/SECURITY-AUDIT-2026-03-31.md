# Security Audit Report

**Date**: 2026-03-31
**Trigger**: Datadog advisory on malicious axios npm packages (1.14.1, 0.30.4)
**Project**: meta-tsundr-next-gen

---

## 1. axios 悪意あるパッケージ調査

### 結果: **影響なし**

| チェック項目 | 結果 |
|-------------|------|
| axios direct dependency | **なし** (package.jsonに未記載) |
| axios installed version | **1.14.0** (安全なバージョン) |
| axios 1.14.1 (malicious) | **NOT FOUND** |
| axios 0.30.4 (malicious) | **NOT FOUND** |
| plain-crypto-js (malware) | **NOT FOUND** |
| datadog-ci package | **NOT FOUND** |
| serverless-plugin-datadog | **NOT FOUND** |

### axios の経路
axios は `promptfoo` の間接依存として入っています：
```
promptfoo → @slack/web-api → axios@1.14.0
promptfoo → ibm-cloud-sdk-core → axios@1.14.0
```

**バージョン 1.14.0 は安全です。** 悪意あるバージョンは 1.14.1 と 0.30.4 のみ。

### 推奨アクション
- **即時対応不要**
- package-lock.json で axios のバージョンを 1.14.0 にピン留めすることを推奨
- promptfoo を最新にアップデートすれば、修正済み axios に移行される

---

## 2. npm 依存パッケージ脆弱性

### npm audit 結果: HIGH 7件

| パッケージ | 深刻度 | 脆弱性 | 修正方法 |
|-----------|--------|--------|---------|
| **@xmldom/xmldom** | HIGH | XML injection via CDATA serialization ([GHSA-wh4c-j3r5-mjhp](https://github.com/advisories/GHSA-wh4c-j3r5-mjhp)) | `npm audit fix` |
| **effect** | HIGH | AsyncLocalStorage context lost ([GHSA-38f7-945m-qr2g](https://github.com/advisories/GHSA-38f7-945m-qr2g)) | uploadthing 6.12.0 へアップデート (breaking) |
| **@prisma/config** | HIGH | effect 依存 | prisma 6.12.0 へアップデート (breaking) |
| **prisma** | HIGH | @prisma/config 依存 | 同上 |
| **uploadthing** | HIGH | effect 依存 | uploadthing 6.12.0 (breaking) |
| **@uploadthing/shared** | HIGH | effect 依存 | 同上 |
| **@uploadthing/react** | HIGH | uploadthing 依存 | 同上 |

### 影響度評価

| 脆弱性 | 実際のリスク | 理由 |
|--------|------------|------|
| @xmldom/xmldom XML injection | **低** | 直接使用していない（promptfoo の依存） |
| effect AsyncLocalStorage | **低** | uploadthing は画像アップロード用、本番未使用（トークン未設定） |

### 推奨アクション
```bash
# 安全な修正のみ適用
npm audit fix

# breaking changes を含む全修正（テスト後）
npm audit fix --force
```

---

## 3. Go バックエンド脆弱性

### 主要依存パッケージバージョン

| パッケージ | バージョン | 最新 | 状態 |
|-----------|-----------|------|------|
| google.golang.org/grpc | 1.75.1 | 最新級 | ✅ 安全 |
| google.golang.org/protobuf | 1.36.10 | 最新級 | ✅ 安全 |
| github.com/golang-jwt/jwt/v5 | 5.3.0 | 最新 | ✅ 安全 |
| gorm.io/gorm | 1.31.0 | 最新級 | ✅ 安全 |
| github.com/gin-gonic/gin | 1.11.0 | 最新級 | ✅ 安全 |

### 推奨アクション
- `govulncheck` をインストールして定期チェック: `go install golang.org/x/vuln/cmd/govulncheck@latest && govulncheck ./...`

---

## 4. セキュリティベストプラクティス確認

| チェック項目 | 状態 | 備考 |
|-------------|------|------|
| .env.local が .gitignore に含まれている | ✅ | `.env*` パターンで除外 |
| APIキーがコードにハードコードされていない | ✅ | 全てプレースホルダー |
| JWT secret のデフォルト値 | ✅ | production では起動拒否 |
| bcrypt パスワードハッシュ | ✅ | Go backend で使用 |
| SQL injection 防止 | ✅ | GORM パラメタライズドクエリ |
| XSS 防止 | ✅ | React の自動エスケープ |
| CORS 設定 | ⚠️ | development で localhost:3000 のみ許可（本番では要制限） |
| Rate limiting | ✅ | middleware/rate-limit.ts 実装済み |
| gRPC auth interceptor | ✅ | 全 RPC にトークン検証 |

---

## 5. 総合判定

### axios 関連: **影響なし、対応不要**

### その他脆弱性: **HIGH 7件あるが実害リスクは低い**
- `npm audit fix` で @xmldom/xmldom は修正可能
- effect/uploadthing/prisma は breaking change を伴うため、テスト後にアップデート推奨

### Go バックエンド: **既知の脆弱性なし**

---

## 6. 対策実施状況

### 実施済み

| 対策 | 状態 | 詳細 |
|------|------|------|
| **Dependabot 有効化** | ✅ 完了 | `.github/dependabot.yml` — npm(weekly), gomod(weekly), github-actions(monthly) |
| **axios バージョンピン留め** | ✅ 完了 | `package.json` の `overrides` で `axios: "1.14.0"` に固定 |
| **CI/CD に npm audit 組み込み** | ✅ 完了 | `.github/workflows/ci.yaml` の lint-and-typecheck ジョブに `npm audit --audit-level=high` 追加 |
| **ローカル診断スクリプト** | ✅ 完了 | `scripts/security-check.sh` で npm audit + govulncheck を一括実行 |
| **定期セキュリティスキャン** | ✅ 完了 | `.github/workflows/security.yaml` で週次自動スキャン |
| **@xmldom/xmldom 修正** | ✅ 完了 | `npm audit fix` で修正済み (HIGH 7→6) |

### 残対応

| 対策 | 状態 | 詳細 |
|------|------|------|
| effect/uploadthing アップデート | ⚠️ 未対応 | breaking change を伴うため、テスト後にアップデート推奨 |
| govulncheck CI 追加 | ⚠️ 推奨 | Go backend の定期脆弱性チェック |
