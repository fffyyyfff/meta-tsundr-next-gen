#!/bin/bash
# Usage: ./.tmux-status.sh
# 全エージェントペインの最新5行を表示
source "$(dirname "$0")/.tmux-panes.env"
echo "=== Agent Status ==="
for PANE in $WORKER_PANES; do
  echo "--- Pane $PANE ---"
  tmux capture-pane -t "$PANE" -p | tail -n 5
  echo ""
done
