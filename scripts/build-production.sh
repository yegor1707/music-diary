#!/bin/bash
set -e

echo "Installing dependencies..."
pnpm install

echo "Building frontend..."
pnpm --filter @workspace/music-notebook run build

echo "Building API server..."
pnpm --filter @workspace/api-server run build

echo "Build complete!"
echo "Frontend: artifacts/music-notebook/dist/public"
echo "API server: artifacts/api-server/dist/index.mjs"
