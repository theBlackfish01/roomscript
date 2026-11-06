#!/usr/bin/env bash
# Usage: wait-lens-log.sh MARKER [TIMEOUT_SECONDS]  - waits for a new Lens Studio log line containing MARKER.
LOG=$(ls -t "/c/Users/wadoo/AppData/Local/Snap/Lens Studio/logs/"LensStudioLog-*.txt | head -1)
timeout "${2:-60}" tail -n0 -F "$LOG" 2>/dev/null | grep -a -m1 --line-buffered "$1" | cut -c1-1500
[ "${PIPESTATUS[0]}" = "124" ] && echo "TIMEOUT waiting for $1"
exit 0
