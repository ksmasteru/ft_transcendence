#!/bin/bash

# ========== Configuration ==========
containers=("gateway-container" "user-service-container" "log-service-container")

# Define color codes
colors=(
  "\033[1;34m"  # Blue
  "\033[1;32m"  # Green
  "\033[1;35m"  # Magenta
  "\033[1;36m"  # Cyan
  "\033[1;33m"  # Yellow
  "\033[1;31m"  # Red
)
NC="\033[0m" # No Color

# ========== Cleanup on Exit ==========
cleanup() {
  echo -e "\n🔧 Cleaning up log streams..."
  pkill -P $$
  exit 0
}
trap cleanup SIGINT

# ========== Function to Stream Logs ==========
stream_logs() {
  local container=$1
  local color=$2

  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    echo -e "${color}⚠️  Container '${container}' not found or not running.${NC}"
    return
  fi

  echo -e "${color}📜 Streaming logs for ${container}...${NC}"
  
  docker logs -f "$container" 2>&1 | while IFS= read -r line; do
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "${color}[${timestamp}] [${container}]${NC} $line"
  done
}

# ========== Main Loop ==========
i=0
for container in "${containers[@]}"; do
  color=${colors[$((i % ${#colors[@]}))]}
  stream_logs "$container" "$color" &
  ((i++))
done

wait
