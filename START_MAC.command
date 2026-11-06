#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Online Library Management System..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not in PATH. Install and open Docker Desktop first."
  read -r -p "Press Enter to close..."
  exit 1
fi
docker compose up --build -d
echo "When the containers are ready, open http://localhost:3000"
read -r -p "Press Enter to close..."
