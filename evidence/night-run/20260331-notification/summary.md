# Evidence: 通知・Webhook機能実装

## セッション概要

| 項目 | 値 |
|------|-----|
| 日時 | 2026-03-31 |
| 構成 | Worker (pane %1) |
| タスク数 | 1 |

## 完了タスク一覧

| # | Pane | タスク | 主な対象ファイル |
|---|------|--------|------------------|
| 1 | %1 | 通知・Webhook機能 | notification.ts, notification-bell.tsx, notificationStore.ts, _app.ts, layout.tsx, schema.prisma |

## 変更ファイル一覧

| ファイル | 状態 |
|----------|------|
| `src/server/services/notification.ts` | 新規 |
| `src/server/routers/notification.ts` | 新規 |
| `src/stores/notificationStore.ts` | 新規 |
| `src/components/notification-bell.tsx` | 新規 |
| `src/server/routers/_app.ts` | 更新 |
| `src/app/layout.tsx` | 更新 |
| `prisma/schema.prisma` | 更新 |

## 検証結果

| 検証項目 | 結果 | ログファイル |
|----------|------|-------------|
| TypeCheck (`tsc --noEmit`) | PASS | [typecheck.log](./typecheck.log) |
| Build (`next build`) | PASS | [build.log](./build.log) |
| E2E Tests (dashboard+home) | 8/8 PASS | — |

## スクリーンショット

![Header with notification bell](./01-header-notification-bell.png)
ヘッダーにNotificationBell（ベルアイコン）とThemeToggleが配置されている状態。

## プロジェクト統計

| 項目 | 値 |
|------|-----|
| 新規ファイル数 | 4 |
| 更新ファイル数 | 3 |
| Prismaモデル追加 | 2 (Notification, WebhookConfig) |
| tRPCエンドポイント追加 | 3 (listNotifications, markAsRead, configureWebhook) |
