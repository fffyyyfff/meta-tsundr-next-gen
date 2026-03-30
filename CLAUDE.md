@AGENTS.md
<!-- TMUX-AGENT-CONFIG -->
## tmux マルチエージェント環境

このプロジェクトはtmux上でマルチエージェント並列実行しています。

### ペイン構成 (Layout: triple)
- **Orchestrator**: `%0` — タスク分解・割り当て・進捗管理
- **Worker1**: `%1` — タスク実行
- **Worker2**: `%2` — タスク実行

### ペイン間通信コマンド

**部下ペインにタスクを送信:**
```bash
./.tmux-send-task.sh %1 "タスクの内容"
```

**部下ペインの出力をキャプチャ（最新30行）:**
```bash
./.tmux-capture.sh %1 30
```

**全ワーカーに一斉送信:**
```bash
./.tmux-broadcast.sh "全員への指示"
```

**全ペインの状態確認:**
```bash
./.tmux-status.sh
```

### オーケストレーターのルール
1. タスクを分解して各ワーカーに`./.tmux-send-task.sh`で送信
2. 定期的に`./.tmux-capture.sh`で進捗を確認
3. 結果を回収・統合して次のタスクを割り当て
4. トークン消費が多い場合は`/clear`を指示
5. 報告形式: `[pane_id] 完了/進捗/エラー: 内容`
<!-- END-TMUX-AGENT-CONFIG -->
