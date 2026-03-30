#!/bin/bash
# Usage: ./.tmux-send-task.sh <pane_id> "<message>"
# オーケストレーターペインから部下ペインにClaude Codeへの入力を送信
PANE="$1"; shift
MSG="$*"
tmux send-keys -t "$PANE" "$MSG" C-m
