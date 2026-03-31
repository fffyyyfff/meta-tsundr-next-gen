# E2E Test Fix Evidence — 2026-03-31

## タスク概要
UI改修（ショートカット+a11y、比較+お気に入り等）でセレクタがずれていた E2E テスト6件を修正

## 修正内容

| テストファイル | 失敗数 | 原因 | 修正内容 |
|---------------|--------|------|----------|
| `tests/e2e/agent.spec.ts` | 2 | `AgentDashboard` コンポーネントが未使用。テストが "AI Agent Dashboard" / "No agents running" を探すが、実際のページは `AgentResults` で異なるテキスト | セレクタを実際の UI テキストに合わせて更新: "Execute AI Agent Task" / "No agent results yet..." |
| `tests/e2e/workflow.spec.ts` | 4 | (1) `CardTitle` が `<div>` で `getByRole('heading')` でヒットしない (2) `getByLabel('Task Description')` が agent-executor と workflow-runner の2要素にマッチ | (1) `getByText` に変更 (2) `page.locator('#workflow-task')` でワークフロー専用入力を一意特定 |

## 変更ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `tests/e2e/agent.spec.ts` | セレクタを実際のUIテキストに更新 |
| `tests/e2e/workflow.spec.ts` | heading→getByText、Label→#workflow-task セレクタに修正 |

## 検証結果

| 検証項目 | 結果 | ログ |
|----------|------|------|
| 型チェック (`tsc --noEmit`) | **PASS** — エラー0 | `typecheck.log` |
| E2E テスト (agent + workflow) | **9/9 PASS** | `e2e-test.log` |
