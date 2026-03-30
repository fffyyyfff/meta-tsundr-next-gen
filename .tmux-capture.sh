#!/bin/bash
# Usage: ./.tmux-capture.sh <pane_id> [lines=30]
# 指定ペインの最新N行をキャプチャして表示
PANE="$1"
LINES="${2:-30}"
tmux capture-pane -t "$PANE" -p | tail -n "$LINES"
