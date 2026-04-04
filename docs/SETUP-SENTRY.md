# Sentry セットアップガイド

## 1. Sentry プロジェクト作成

1. [sentry.io](https://sentry.io) でアカウント作成
2. 新規プロジェクト作成 → プラットフォーム: **Next.js**
3. DSN をコピー

## 2. 環境変数設定

```bash
# .envrc に追加
export SENTRY_DSN=https://xxxx@o1234.ingest.sentry.io/5678
```

または `.env.local`:
```
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@o1234.ingest.sentry.io/5678
```

## 3. 動作確認

開発サーバーを起動した状態で以下にアクセス:

```bash
curl http://localhost:3000/api/test-error
```

レスポンス:
```json
{"error":"Test error sent to Sentry","timestamp":"2026-04-05T..."}
```

Sentry ダッシュボード → Issues に「Sentry test error」が表示されれば成功。

## 4. 実装概要

| ファイル | 役割 |
|---------|------|
| `src/shared/lib/sentry.ts` | Sentry 初期化（DSN 未設定時は何もしない） |
| `src/shared/components/sentry-init.tsx` | Client Component で初期化を実行 |
| `src/shared/components/error-boundary.tsx` | React エラーを `Sentry.captureException` で送信 |
| `src/app/api/test-error/route.ts` | 動作確認用エンドポイント |

## 5. 本番運用時の注意

- `tracesSampleRate: 0.1` (10%) でパフォーマンストレースを取得
- 本番では `SENTRY_DSN` を環境変数で設定（ハードコーディング禁止）
- Source Map アップロードは `@sentry/nextjs` の Webpack plugin で自動化可能
