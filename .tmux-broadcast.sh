#!/bin/bash
# Usage: ./.tmux-broadcast.sh "<message>"
# 全ワーカーペインに同じメッセージを送信
MSG="$*"
for PANE in %1 %2; do
  tmux send-keys -t "$PANE" "$MSG" C-m
  sleep 0.2
done
